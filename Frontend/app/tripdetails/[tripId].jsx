import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { db } from '../../configs/FirebaseConfig';

const GOOGLE_MAPS_APIKEY = 'AIzaSyA8030AUz37dHV1PKSrWZ1gzq0V6SSOjn8'; // Replace with your Google Maps API key

const TripDetailsScreen = () => {
    const { tripId } = useLocalSearchParams();
    const [tripDetails, setTripDetails] = useState(null);
    const [places, setPlaces] = useState([]);
    const [suggestedPlaces, setSuggestedPlaces] = useState([]);
    const [mapMarkers, setMapMarkers] = useState([]);
    const [currentPlaceIndex, setCurrentPlaceIndex] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load MaterialIcons font
    const [fontsLoaded] = useFonts({
        'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    });

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const docRef = doc(db, 'UserTrips', tripId.toString());
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const tripData = docSnap.data();
                    setTripDetails(tripData);
                    setPlaces(JSON.parse(tripData.tripPlan.places) || []);
                    setSuggestedPlaces(tripData.suggested_places || []);

                    // Parse map markers with error handling
                    try {
                        const markersFromTrip = tripData.tripPlan.mapMarkers
                            ? JSON.parse(tripData.tripPlan.mapMarkers)
                            : [];
                        setMapMarkers(markersFromTrip);
                    } catch (error) {
                        console.error('Error parsing map markers:', error);
                        setMapMarkers([]);
                        ToastAndroid.show('Invalid map markers data', ToastAndroid.LONG);
                    }
                } else {
                    ToastAndroid.show('No such trip found!', ToastAndroid.LONG);
                }
            } catch (error) {
                ToastAndroid.show('Error fetching trip details', ToastAndroid.LONG);
                console.error('Fetch trip details error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (tripId) {
            fetchTripDetails();
        }
    }, [tripId]);

    useEffect(() => {
        let timer;
        if (currentPlaceIndex !== null) {
            timer = setInterval(() => {
                checkTimeExceeded();
            }, 60000);
        }
        return () => clearInterval(timer);
    }, [currentPlaceIndex]);

    useEffect(() => {
        const getLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Permission to access location was denied');
                    return;
                }

                const currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation.coords);
                console.log('Initial Location:', currentLocation.coords);

                Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    },
                    (newLocation) => {
                        setLocation(newLocation.coords);
                    }
                );
            } catch (error) {
                console.error('Location error:', error);
                Alert.alert('Error', 'Failed to fetch location');
            } finally {
                setLoading(false);
            }
        };

        getLocation();
    }, []);

    const setTripStatus = async () => {
        try {
            const docRef = doc(db, 'UserTrips', tripId.toString());
            let newStatus = '';

            if (tripDetails.status === 'not-started') {
                Alert.alert(
                    'Start Tour',
                    'Are you sure you want to start this tour?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Start',
                            onPress: async () => {
                                newStatus = 'started';
                                await updateDoc(docRef, { status: newStatus });
                                setTripDetails((prevState) => ({ ...prevState, status: newStatus }));
                                ToastAndroid.show('Trip started!', ToastAndroid.LONG);
                            },
                        },
                    ]
                );
            } else if (tripDetails.status === 'started') {
                Alert.alert(
                    'End Tour',
                    'Are you sure you want to end this tour?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'End',
                            onPress: async () => {
                                newStatus = 'end';
                                await updateDoc(docRef, { status: newStatus });
                                setTripDetails((prevState) => ({ ...prevState, status: newStatus }));
                                ToastAndroid.show('Trip ended!', ToastAndroid.LONG);
                            },
                        },
                    ]
                );
            } else {
                ToastAndroid.show('Trip is already completed!', ToastAndroid.LONG);
            }
        } catch (error) {
            ToastAndroid.show('Error updating trip status', ToastAndroid.LONG);
            console.error('Set trip status error:', error);
        }
    };

    const setCurrentPlace = (index) => {
        if (tripDetails.status === 'not-started') {
            Alert.alert('Trip Not Started', 'You need to start the trip before selecting a place.');
            return;
        }

        setPlaces((prevPlaces) =>
            prevPlaces.map((place, idx) => ({
                ...place,
                currentPlace: idx === index,
            }))
        );
        setCurrentPlaceIndex(index);
        setStartTime(new Date());
    };

    const checkTimeExceeded = async () => {
        if (currentPlaceIndex === null) return;

        const currentPlace = places[currentPlaceIndex];
        const elapsedTime = (new Date() - startTime) / 60000;
        const allocatedTime = currentPlace.time.hours * 60 + currentPlace.time.minutes;
        const next_location = places[currentPlaceIndex + 1]?.name || '';

        if (elapsedTime > allocatedTime) {
            if (currentPlaceIndex === places.length - 1) {
                Alert.alert(
                    'Time Exceeded',
                    `You have exceeded the allocated time for ${currentPlace.name}.`
                );
                setCurrentPlaceIndex(null);
            } else {
                try {
                    // Replace with your actual backend URL (e.g., hosted or ngrok)
                    const response = await fetch('http://your-backend-url/recommend_place', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ current_location: currentPlace.name, next_location }),
                    }).catch((error) => {
                        ToastAndroid.show('Network error: Could not reach recommendation service', ToastAndroid.LONG);
                        throw error;
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch suggested place');
                    }

                    const data = await response.json();
                    const suggestedPlaceName = data.name || 'Galle';
                    const suggestedHours = data.hours ?? 2;
                    const suggestedMinutes = data.minutes ?? 0;

                    Alert.alert(
                        'Time Exceeded',
                        `You have exceeded the allocated time for ${currentPlace.name}.\nWould you like to visit ${suggestedPlaceName} instead?`,
                        [
                            { text: 'Ignore', style: 'cancel' },
                            {
                                text: 'Accept Suggestion',
                                onPress: () => saveSuggestedPlace(next_location, suggestedPlaceName, suggestedHours, suggestedMinutes),
                            },
                        ]
                    );
                } catch (error) {
                    ToastAndroid.show('Error fetching suggested place', ToastAndroid.LONG);
                    console.error('Check time exceeded error:', error);
                }
            }
        }
    };

    const saveSuggestedPlace = async (planned, placeName, hours, minutes) => {
        try {
            const newPlace = { planned, name: placeName, time: { hours, minutes } };
            const docRef = doc(db, 'UserTrips', tripId.toString());

            const updatedPlaces = places.map((place) => {
                if (place.name === planned) {
                    return { ...place, name: placeName, time: { hours, minutes } };
                }
                return place;
            });

            await updateDoc(docRef, {
                suggested_places: arrayUnion(newPlace),
                'tripPlan.places': JSON.stringify(updatedPlaces),
            });

            setPlaces(updatedPlaces);
            setSuggestedPlaces((prev) => [...prev, newPlace]);

            ToastAndroid.show(`${placeName} added to suggested places and replaced in the plan!`, ToastAndroid.LONG);
        } catch (error) {
            ToastAndroid.show('Error adding suggested place', ToastAndroid.LONG);
            console.error('Save suggested place error:', error);
        }
    };

    const makeCall = (phoneNumber) => {
        Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
            Alert.alert('Error', 'Failed to make a call')
        );
    };

    if (!fontsLoaded || loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0478A7" />
            </View>
        );
    }

    if (!tripDetails) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Failed to load trip details. Please try again.</Text>
            </View>
        );
    }

    const renderItem = ({ item }) => {
        switch (item.type) {
            case 'header':
                return (
                    <>
                        <Text style={styles.mainLocation}>{item.data.tripPlan.mainLocation}</Text>
                        <Text style={styles.tripDate}>
                            Start Date: {new Date(item.data.tripPlan.startDate).toLocaleDateString()}
                        </Text>
                        <Text style={styles.tripDate}>
                            End Date: {new Date(item.data.tripPlan.endDate).toLocaleDateString()}
                        </Text>
                    </>
                );
            case 'emergency':
                return (
                    <View style={styles.emergencyContainer}>
                        <Pressable style={[styles.emergencyButton, { backgroundColor: '#ff4d4d' }]} onPress={() => makeCall(1990)}>
                            <MaterialIcons name="local-hospital" size={40} color="#fff" />
                            <Text style={styles.emergencyLabel}>1990</Text>
                        </Pressable>
                        <Pressable style={[styles.emergencyButton, { backgroundColor: '#007bff' }]} onPress={() => makeCall(119)}>
                            <MaterialIcons name="local-police" size={40} color="#fff" />
                            <Text style={styles.emergencyLabel}>119</Text>
                        </Pressable>
                        <Pressable style={[styles.emergencyButton, { backgroundColor: '#ff8000' }]} onPress={() => makeCall(110)}>
                            <MaterialIcons name="local-fire-department" size={40} color="#fff" />
                            <Text style={styles.emergencyLabel}>110</Text>
                        </Pressable>
                    </View>
                );
            case 'map':
                // Ensure the first destination exists and has valid coordinates
                const firstDestination = mapMarkers.length > 0 ? mapMarkers[0] : null;
                return (
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: location ? location.latitude : 7.8731,
                            longitude: location ? location.longitude : 80.7718,
                            latitudeDelta: 0.1, // Adjusted for closer zoom to show route
                            longitudeDelta: 0.1,
                        }}
                        showsUserLocation={true}
                        followsUserLocation={true}
                    >
                        {mapMarkers.length > 0 &&
                            mapMarkers.map((marker, index) => (
                                <Marker
                                    key={index}
                                    coordinate={marker}
                                    title={places[index]?.name || `Destination ${index + 1}`}
                                    pinColor={index === 0 ? 'red' : 'purple'} // Highlight first destination
                                />
                            ))}
                        {location && (
                            <Marker
                                coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                                title="Your Location"
                                pinColor="blue"
                            />
                        )}
                        {location && firstDestination && (
                            <MapViewDirections
                                origin={{ latitude: location.latitude, longitude: location.longitude }}
                                destination={firstDestination}
                                apikey={GOOGLE_MAPS_APIKEY}
                                strokeWidth={4}
                                strokeColor="#0478A7"
                                mode="DRIVING"
                                onError={(error) => {
                                    console.error('MapViewDirections error:', error);
                                    ToastAndroid.show('Failed to load route', ToastAndroid.LONG);
                                }}
                            />
                        )}
                    </MapView>
                );
            case 'status':
                return item.data.status === 'not-started' || item.data.status === 'started' ? (
                    <Pressable style={styles.startTripButton} onPress={setTripStatus}>
                        <Text style={styles.startTripButtonText}>
                            {item.data.status === 'not-started' ? 'Start Tour' : 'End Tour'}
                        </Text>
                    </Pressable>
                ) : null;
            case 'places':
                return (
                    <>
                        <Text style={styles.subHeader}>Tour Plan</Text>
                        <FlatList
                            data={item.data}
                            renderItem={({ item: place, index }) => (
                                <View style={[styles.placeItem, place.currentPlace && { backgroundColor: '#FFEBB7' }]}>
                                    <Text style={styles.placeName}>{place.name}</Text>
                                    <Text style={styles.placeTime}>{place.time.hours}h {place.time.minutes}m</Text>
                                    <Pressable onPress={() => setCurrentPlace(index)} style={styles.placeButtonContainer}>
                                        <MaterialIcons name="check-circle" size={24} color={place.currentPlace ? '#FF821E' : '#666'} />
                                    </Pressable>
                                </View>
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            nestedScrollEnabled={true}
                        />
                    </>
                );
            case 'suggested':
                return (
                    <>
                        <Text style={styles.subHeader}>Suggested Places</Text>
                        <FlatList
                            data={item.data}
                            renderItem={({ item: suggested }) => (
                                <View style={styles.suggestedPlaceItem}>
                                    <Text style={styles.plannedText}>Planned: {suggested.planned ?? ''}</Text>
                                    <Text style={styles.suggestedText}>Suggested: {suggested.name ?? ''}</Text>
                                    <Text style={styles.placeTime}>{suggested.time.hours ?? ''}h {suggested.time.minutes ?? ''}m</Text>
                                </View>
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            nestedScrollEnabled={true}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    const data = [
        { type: 'header', data: tripDetails },
        { type: 'emergency', data: {} },
        { type: 'map', data: {} },
        { type: 'status', data: tripDetails },
        { type: 'places', data: places },
        ...(suggestedPlaces.length > 0 ? [{ type: 'suggested', data: suggestedPlaces }] : []),
    ];

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.container}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        paddingBottom: 40,
    },
    mainLocation: {
        fontSize: 33,
        color: '#0478A7',
        fontWeight: 'bold',
        fontStyle: 'italic',
        fontFamily: 'serif',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    tripDate: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
    },
    subHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    errorText: {
        fontSize: 16,
        color: '#ff4d4d',
        textAlign: 'center',
        marginVertical: 20,
    },
    map: {
        height: 300,
        width: '100%',
        marginVertical: 10,
    },
    placeItem: {
        padding: 15,
        marginVertical: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    suggestedPlaceItem: {
        padding: 15,
        marginVertical: 10,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
    },
    placeName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    placeTime: {
        fontSize: 14,
        color: '#666',
    },
    plannedText: {
        fontSize: 16,
        color: '#333',
    },
    suggestedText: {
        fontSize: 16,
        color: '#0478A7',
        fontWeight: 'bold',
    },
    placeButtonContainer: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    startTripButton: {
        backgroundColor: '#0478A7',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    startTripButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emergencyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginVertical: 20,
    },
    emergencyButton: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    emergencyLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5,
    },
});

export default TripDetailsScreen;