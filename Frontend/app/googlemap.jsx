import React, { useEffect, useState } from "react";
import { View, StyleSheet, Button, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [waitingStartTime, setWaitingStartTime] = useState(null);

  const markers = [
    { latitude: 7.8731, longitude: 80.7718 }, // Example first destination
    // Add more markers dynamically
  ];

  useEffect(() => {
    let locationSubscription;

    if (tracking) {
      locationSubscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setUserLocation(location.coords);

          const firstDestination = markers[0];
          const distance = getDistance(
            location.coords.latitude,
            location.coords.longitude,
            firstDestination.latitude,
            firstDestination.longitude
          );

          if (distance < 50 && !arrived) { // If within 50 meters, user has arrived
            setArrived(true);
            setWaitingStartTime(new Date());
            Alert.alert("Arrived at First Location", "Waiting time calculation started.");
          }
        }
      );
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.then((sub) => sub.remove());
      }
    };
  }, [tracking]);

  const startTour = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location access is required to track your trip.");
      return;
    }
    setTracking(true);
    setArrived(false);
    setWaitingStartTime(null);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 7.8731,
          longitude: 80.7718,
          latitudeDelta: 2.5,
          longitudeDelta: 2.5,
        }}
      >
        {markers.map((marker, index) => (
          <Marker key={index} coordinate={marker} title={`Destination ${index + 1}`} />
        ))}

        {userLocation && <Marker coordinate={userLocation} title="You" pinColor="blue" />}
      </MapView>
      <Button title={tracking ? "Tracking..." : "Start Tour"} onPress={startTour} disabled={tracking} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
    marginTop: 40,
    borderRadius: 32,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default MapScreen;
