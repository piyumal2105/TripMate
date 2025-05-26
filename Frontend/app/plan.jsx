import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ToastAndroid, StyleSheet, ScrollView } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import moment from 'moment';
import { db } from '../configs/FirebaseConfig';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { FlatList } from 'react-native';
import MapViewDirections from 'react-native-maps-directions';


const TripPlannerScreen = () => {
    const [mainLocation, setMainLocation] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [places, setPlaces] = useState([]);
    const [placeName, setPlaceName] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [markers, setMarkers] = useState([]);

    const router = useRouter();

    const onDateChange = (date, type) => {
        if (type === 'START_DATE') {
            setStartDate(moment(date));
        } else {
            setEndDate(moment(date));
        }
    };

    const handleAddPlace = async () => {
        if (placeName && hours >= 0 && minutes >= 0) {
            try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${placeName}&key=AIzaSyA8030AUz37dHV1PKSrWZ1gzq0V6SSOjn8`);
                const data = await response.json();
    
                if (data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    const newPlace = {
                        name: placeName,
                        time: { hours, minutes },
                        latitude: location.lat,
                        longitude: location.lng,
                    };
    
                    setPlaces([...places, newPlace]);
                    setMarkers([...markers, { latitude: location.lat, longitude: location.lng }]);
                    setPlaceName('');
                    setHours(0);
                    setMinutes(0);
                } else {
                    ToastAndroid.show('Location not found', ToastAndroid.LONG);
                }
            } catch (error) {
                console.error('Error fetching location:', error);
            }
        }
    };
    

    const handleMapPress = (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkers([...markers, { latitude, longitude }]);
    };
    

    const handleSubmit = async () => {
        if (!mainLocation.trim()) {
            ToastAndroid.show('Please enter a main location', ToastAndroid.LONG);
            return;
        }
        if (!startDate || !endDate) {
            ToastAndroid.show('Please select start and end dates', ToastAndroid.LONG);
            return;
        }
    
        const totalNoOfDays = endDate.diff(startDate, 'days');
        if(markers.length === 0) {
            console.log("Please select locations on map");
            return;
        }
        console.log('Trip Plan:', {
            mainLocation,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalNoOfDays: totalNoOfDays + 1,
            places,
            mapMarkers: markers,
        })
        const tripPlan = {
            mainLocation,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalNoOfDays: totalNoOfDays + 1,
            places: JSON.stringify(places),
            mapMarkers: JSON.stringify(markers),
        };
    
        const docId = Date.now().toString();
    
        try {
            await setDoc(doc(db, "UserTrips", docId), {
                tripPlan,
                docId,
                status: "not-started"
            });
    
            console.log("Trip successfully saved to Firestore!");
            router.push('/home');
        } catch (error) {
            console.error("Error saving trip:", error);
        }
    };
    

    return (
        
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Plan Your Trip</Text>

            <Text style={styles.label}>Enter Location</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Location"
                value={mainLocation}
                onChangeText={setMainLocation}
            />
            
            <Text style={styles.label}>Select Dates</Text>
            <CalendarPicker
                onDateChange={(date) => {
                    if (!startDate || endDate) {
                        onDateChange(date, 'START_DATE');
                    } else {
                        onDateChange(date, 'END_DATE');
                    }
                }}
                allowRangeSelection
                minDate={new Date()}
                maxRangeDuration={5}
                selectedRangeStyle={{
                    backgroundColor: '#4CAF50', 
                }}
                selectedDayTextStyle={{
                    color: '#fff',
                }}
                selectedDayStyle={{
                    backgroundColor: '#4CAF50',
                }}
            />

            <Text style={styles.label}>Select Locations on Map</Text>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 7.8731,  
                    longitude: 80.7718, 
                    latitudeDelta: 2.5, 
                    longitudeDelta: 2.5,
                  }}
                  
                onPress={handleMapPress}
            >
                {markers.map((marker, index) => (
                    <Marker key={index} coordinate={marker} />
                ))}
            </MapView>


            <Text style={styles.label}>Add Places</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Place Name"
                value={placeName}
                onChangeText={setPlaceName}
            />

            <View style={styles.timeContainer}>
                <TextInput
                    style={styles.inputTime}
                    placeholder="Hours"
                    keyboardType="numeric"
                    value={String(hours)}
                    onChangeText={(text) => setHours(parseInt(text) || 0)}
                />
                <TextInput
                    style={styles.inputTime}
                    placeholder="Minutes"
                    keyboardType="numeric"
                    value={String(minutes)}
                    onChangeText={(text) => setMinutes(parseInt(text) || 0)}
                />
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddPlace}>
                <Text style={styles.addButtonText}>Add Place</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Places List</Text>
            {places.length > 0 ? (
                places.map((place, index) => (
                    <View key={index} style={styles.placeItem}>
                        <Text style={styles.placename}>{place.name}</Text>
                        <Text style={styles.placetime}>
                            {place.time.hours} hours, {place.time.minutes} minutes
                        </Text>
                    </View>
                ))
            ) : (
                <Text>No places added yet.</Text>
            )}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit Trip Plan</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 25,
        backgroundColor: '#fff', 
    },
    header: {
        fontSize: 35,
        marginTop: 20,
        textAlign: 'center',
        fontFamily: 'outfit-medium',
    },
    label: {
        marginVertical: 10,
        fontSize: 16,
        fontFamily: 'outfit-medium',
    },
    input: {
        height: 40,
        borderColor: '#ccc', 
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
        fontFamily: 'outfit-medium',
    },
    map: {
    height: 300,
    width: '100%',
    marginVertical: 10,
},

    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        fontFamily: 'outfit-medium',
    },
    inputTime: {
        width: '48%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
        fontFamily: 'outfit-medium',
    },
    addButton: {
        padding: 15,
        backgroundColor: '#000', 
        borderRadius: 10,
        marginTop: 15,
    },
    addButtonText: {
        textAlign: 'center',
        color: '#fff', 
        fontWeight: '600',
        fontFamily: 'outfit-medium',
    },
    placename: {
        fontFamily: 'outfit-medium',
        fontSize: 20,
    },
    placetime: {
        fontFamily: 'outfit-medium',
        fontSize: 14,
    },
    submitButton: {
        padding: 15,
        backgroundColor: '#000',
        borderRadius: 15,
        marginTop: 35,
        marginBottom: 35,
    },
    submitButtonText: {
        textAlign: 'center',
        color: '#fff', 
        fontWeight: '600',
        fontSize: 20,
        fontFamily: 'outfit-medium',
    },
    placeItem: {
        padding: 10,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#ccc', 
    },
});

export default TripPlannerScreen;