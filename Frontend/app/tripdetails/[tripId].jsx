import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, FlatList, ToastAndroid, Pressable, Linking, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { db } from '../../configs/FirebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

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

                    // Parse the saved map markers if available
                    const markersFromTrip = tripData.tripPlan.mapMarkers ? JSON.parse(tripData.tripPlan.mapMarkers) : [];
                    setMapMarkers(markersFromTrip);
                } else {
                    ToastAndroid.show('No such trip found!', ToastAndroid.LONG);
                }
            } catch (error) {
                ToastAndroid.show('Error fetching trip details', ToastAndroid.LONG);
                console.error(error);
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
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);
            console.log('Initial Location:', currentLocation.coords);
            setLoading(false);

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
                                ToastAndroid.show(`Trip started!`, ToastAndroid.LONG);
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
                                ToastAndroid.show(`Trip ended!`, ToastAndroid.LONG);
                            },
                        },
                    ]
                );
            } else {
                ToastAndroid.show('Trip is already completed!', ToastAndroid.LONG);
            }
        } catch (error) {
            ToastAndroid.show('Error updating trip status', ToastAndroid.LONG);
            console.error(error);
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
        if (currentPlaceIndex !== null) {
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
                        const response = await fetch('http://127.0.0.1:5000/recommend_place', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ current_location: currentPlace.name, next_location }),
                        });

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
                        console.error(error);
                    }
                }
            }
        }
    };

    const saveSuggestedPlace = async (planned, placeName, hours, minutes) => {
        try {
            const newPlace = { planned: planned, name: placeName, time: { hours, minutes } };
            const docRef = doc(db, 'UserTrips', tripId.toString());

            const updatedPlaces = places.map((place, index) => {
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
            console.error(error);
        }
    };

    if (!tripDetails) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    const makeCall = (phoneNumber) => {
        Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
            Alert.alert('Error', 'Failed to make a call')
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.container}>
                <Text style={styles.mainLocation}>{tripDetails.tripPlan.mainLocation}</Text>
                <Text style={styles.tripDate}>
                    Start Date: {new Date(tripDetails.tripPlan.startDate).toLocaleDateString()}
                </Text>
                <Text style={styles.tripDate}>
                    End Date: {new Date(tripDetails.tripPlan.endDate).toLocaleDateString()}
                </Text>

                <View style={styles.emergencyContainer}>
                    <Pressable style={[styles.emergencyButton, { backgroundColor: '#ff4d4d' }]} onPress={() => makeCall(1990)}>
                        <Icon name="local-hospital" size={40} color="#fff" />
                        <Text style={styles.emergencyLabel}>1990</Text>
                    </Pressable>

                    <Pressable style={[styles.emergencyButton, { backgroundColor: '#007bff' }]} onPress={() => makeCall(119)}>
                        <Icon name="local-police" size={40} color="#fff" />
                        <Text style={styles.emergencyLabel}>119</Text>
                    </Pressable>

                    <Pressable style={[styles.emergencyButton, { backgroundColor: '#ff8000' }]} onPress={() => makeCall(110)}>
                        <Icon name="local-fire-department" size={40} color="#fff" />
                        <Text style={styles.emergencyLabel}>110</Text>
                    </Pressable>
                </View>

                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location ? location.latitude : 7.8731,
                        longitude: location ? location.longitude : 80.7718,
                        latitudeDelta: 4,
                        longitudeDelta: 4,
                    }}
                    showsUserLocation={true}
                    followsUserLocation={true}
                >
                    {mapMarkers.length > 0 &&
                        mapMarkers.map((marker, index) => (
                            <Marker key={index} coordinate={marker} />
                        ))}

                    {location && (
                        <Marker
                            coordinate={{
                                latitude: location.latitude,
                                longitude: location.longitude,
                            }}
                            title="Your Location"
                            pinColor="blue"
                        />
                    )}
                </MapView>

                {(tripDetails.status === 'not-started' || tripDetails.status === 'started') && (
                    <Pressable style={styles.startTripButton} onPress={setTripStatus}>
                        <Text style={styles.startTripButtonText}>
                            {tripDetails.status === 'not-started' ? 'Start Tour' : 'End Tour'}
                        </Text>
                    </Pressable>
                )}

                <Text style={styles.subHeader}>Tour Plan</Text>
                <FlatList
                    data={places}
                    renderItem={({ item, index }) => (
                        <View style={[styles.placeItem, item.currentPlace && { backgroundColor: '#FFEBB7' }]}>
                            <Text style={styles.placeName}>{item.name}</Text>
                            <Text style={styles.placeTime}>{item.time.hours}h {item.time.minutes}m</Text>
                            <Pressable onPress={() => setCurrentPlace(index)} style={styles.placeButtonContainer}>
                                <Icon name="check-circle" size={24} color={item.currentPlace ? '#FF821E' : '#666'} />
                            </Pressable>
                        </View>
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    nestedScrollEnabled={true}
                />

                {suggestedPlaces.length > 0 && (
                    <>
                        <Text style={styles.subHeader}>Suggested Places</Text>
                        <FlatList
                            data={suggestedPlaces}
                            renderItem={({ item }) => (
                                <View style={styles.suggestedPlaceItem}>
                                    <Text style={styles.plannedText}>Planned: {item.planned ?? ''}</Text>
                                    <Text style={styles.suggestedText}>Suggested: {item.name ?? ''}</Text>
                                    <Text style={styles.placeTime}>{item.time.hours ?? ''}h {item.time.minutes ?? ''}m</Text>
                                </View>
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            nestedScrollEnabled={true}
                        />
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        paddingBottom: 40,
    },
    icon: {
        width: 30,
        height: 30, 
        marginRight: 10,
    },
    callButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginTop: 15,
    },
    callButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
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
    locationButton: {
        flexDirection: 'row', 
        alignItems: 'center',  
        justifyContent: 'center', 
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        borderWidth: 1
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