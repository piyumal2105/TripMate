import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Linking,
} from "react-native";
import axios from "axios";
import { auth } from "../../configs/FirebaseConfig.js";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const db = getFirestore();
const { width } = Dimensions.get("window");

const SRI_LANKA_BOUNDS = {
  northEast: { latitude: 9.9, longitude: 81.9 },
  southWest: { latitude: 5.9, longitude: 79.5 },
};

const SRI_LANKA_CENTER = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

const WebMap = ({ places, selectedPlace, onSelectPlace }) => {
  if (Platform.OS !== "web") return null;

  const mapContainerRef = React.useRef(null);

  React.useEffect(() => {
    if (mapContainerRef.current && typeof document !== "undefined") {
      const loadMap = () => {
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.borderRadius = "10px";

        let mapUrl =
          "https://www.openstreetmap.org/export/embed.html?bbox=79.5,5.9,81.9,9.9&layer=mapnik";
        if (
          selectedPlace &&
          selectedPlace.latitude &&
          selectedPlace.longitude
        ) {
          const lat = parseFloat(selectedPlace.latitude);
          const lng = parseFloat(selectedPlace.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            const delta = 0.2;
            mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
              lng - delta
            },${lat - delta},${lng + delta},${
              lat + delta
            }&layer=mapnik&marker=${lat},${lng}`;
          }
        }

        iframe.src = mapUrl;
        iframe.title = "Sri Lanka Map";

        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
          mapContainerRef.current.appendChild(iframe);
        }
      };

      loadMap();
    }
  }, [selectedPlace]);

  const openInteractiveMap = () => {
    let url = "https://www.openstreetmap.org/#map=8/7.8731/80.7718";
    if (selectedPlace && selectedPlace.latitude && selectedPlace.longitude) {
      const lat = parseFloat(selectedPlace.latitude);
      const lng = parseFloat(selectedPlace.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        url = `https://www.openstreetmap.org/#map=15/${lat}/${lng}&layers=N`;
      }
    }
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  return (
    <View style={{ width: "100%", height: "100%" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "90%" }}></div>
      <TouchableOpacity
        style={styles.interactiveMapButton}
        onPress={openInteractiveMap}
      >
        <Text style={styles.interactiveMapButtonText}>
          View on OpenStreetMap (Zoom & Pan)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const MobileMap = ({ places, selectedPlace, onSelectPlace }) => {
  if (Platform.OS === "web") return null;

  const mapRef = useRef(null);
  // Create a ref to store marker references
  const markerRefs = useRef({});

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: SRI_LANKA_BOUNDS.northEast.latitude,
            longitude: SRI_LANKA_BOUNDS.northEast.longitude,
          },
          {
            latitude: SRI_LANKA_BOUNDS.southWest.latitude,
            longitude: SRI_LANKA_BOUNDS.southWest.longitude,
          },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: false,
        }
      );
    }
  }, []);

  useEffect(() => {
    if (selectedPlace && selectedPlace.latitude && selectedPlace.longitude) {
      const lat = parseFloat(selectedPlace.latitude);
      const lng = parseFloat(selectedPlace.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        };

        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }

        // Show the callout for the selected place
        const selectedIndex = places.findIndex(
          (place) => place.name === selectedPlace.name
        );
        if (markerRefs.current[selectedIndex]) {
          markerRefs.current[selectedIndex].showCallout();
        }
      } else {
        mapRef.current.fitToCoordinates(
          [
            {
              latitude: SRI_LANKA_BOUNDS.northEast.latitude,
              longitude: SRI_LANKA_BOUNDS.northEast.longitude,
            },
            {
              latitude: SRI_LANKA_BOUNDS.southWest.latitude,
              longitude: SRI_LANKA_BOUNDS.southWest.longitude,
            },
          ],
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }
    } else if (places.length > 0) {
      // If no place is selected, show the callout for the first place by default
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: SRI_LANKA_BOUNDS.northEast.latitude,
            longitude: SRI_LANKA_BOUNDS.northEast.longitude,
          },
          {
            latitude: SRI_LANKA_BOUNDS.southWest.latitude,
            longitude: SRI_LANKA_BOUNDS.southWest.longitude,
          },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
      // Show callout for the first marker
      if (markerRefs.current[0]) {
        markerRefs.current[0].showCallout();
      }
    }
  }, [selectedPlace, places]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={SRI_LANKA_CENTER}
        zoomEnabled={true}
        scrollEnabled={true}
        zoomTapEnabled={true}
        zoomControlEnabled={true}
        toolbarEnabled={true}
        moveOnMarkerPress={false}
        showsCompass={true}
        showsScale={true}
      >
        {places.map((place, index) => {
          if (place.latitude && place.longitude) {
            const lat = parseFloat(place.latitude);
            const lng = parseFloat(place.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker
                  key={index}
                  ref={(ref) => (markerRefs.current[index] = ref)} // Store marker ref
                  coordinate={{
                    latitude: lat,
                    longitude: lng,
                  }}
                  title={place.name}
                  description={place.category || "Tourist Destination"}
                  pinColor={selectedPlace === place ? "#0478A7" : "#FF0000"}
                  onPress={() => {
                    onSelectPlace(place);
                    // Show callout when marker is pressed
                    if (markerRefs.current[index]) {
                      markerRefs.current[index].showCallout();
                    }
                  }}
                />
              );
            }
          }
          return null;
        })}
      </MapView>
    </View>
  );
};

export default function Maps() {
  const [travelCategories, setTravelCategories] = useState([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const scrollViewRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        fetchUserTravelCategories(user.uid);
      } else {
        setLoading(false);
        setError("User not authenticated. Please login.");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserTravelCategories = async (userId) => {
    try {
      setLoading(true);
      const userPreferencesDoc = await getDoc(
        doc(db, "userPreferences", userId)
      );

      if (
        userPreferencesDoc.exists() &&
        userPreferencesDoc.data().travelCategories
      ) {
        const categories = userPreferencesDoc.data().travelCategories;
        setTravelCategories(categories);
        fetchRecommendedPlaces(categories);
      } else {
        setTravelCategories([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      setError("Failed to load travel categories.");
      setLoading(false);
    }
  };

  const fetchRecommendedPlaces = async (categories) => {
    try {
      let apiUrl;

      if (Platform.OS === "web") {
        apiUrl = "http://localhost:8000/predict/";
      } else if (Platform.OS === "android" && __DEV__) {
        apiUrl = "http://10.0.2.2:8000/predict/";
      } else {
        apiUrl = "http://192.168.1.X:8000/predict/";
      }

      console.log(`Using API URL: ${apiUrl}`);
      const response = await axios.post(apiUrl, {
        categories,
      });

      console.log("API Response:", response.data.recommended_places);
      setRecommendedPlaces(response.data.recommended_places);
      setLoading(false);
    } catch (error) {
      console.error("API Error:", error);
      console.error("Error details:", error.response || error.message || error);
      setError("Failed to fetch recommended places.");
      setLoading(false);
      if (__DEV__) {
        console.log("Using mock data for development");
        setRecommendedPlaces([
          {
            name: "Sigiriya Rock Fortress",
            location: "Sigiriya",
            category: "Heritage",
            province: "Central",
            description: "Ancient rock fortress with frescoes and gardens.",
            latitude: 7.9572,
            longitude: 80.7603,
          },
          {
            name: "Galle Fort",
            location: "Galle",
            category: "Heritage",
            province: "Southern",
            description:
              "Colonial-era fortification and UNESCO World Heritage site.",
            latitude: 6.0269,
            longitude: 80.2171,
          },
          {
            name: "Yala National Park",
            location: "Yala",
            category: "Wildlife",
            province: "Southern",
            description:
              "Famous national park with leopards and diverse wildlife.",
            latitude: 6.3736,
            longitude: 81.5161,
          },
        ]);
        setLoading(false);
      }
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    if (
      Platform.OS === "web" &&
      mapContainerRef.current &&
      scrollViewRef.current
    ) {
      mapContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    if (Platform.OS !== "web" && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 200, animated: true });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0478A7" />
        <Text>Loading your travel preferences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Text style={styles.header}>Your Travel Categories</Text>
      <View style={styles.categoriesContainer}>
        {travelCategories.length > 0 ? (
          travelCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <Text>{category}</Text>
            </View>
          ))
        ) : (
          <Text>No travel categories selected.</Text>
        )}
      </View>
      <Text style={styles.header}>Explore Sri Lanka</Text>
      <View
        ref={Platform.OS === "web" ? mapContainerRef : null}
        style={styles.mapContainer}
      >
        {Platform.OS === "web" ? (
          <WebMap
            places={recommendedPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
          />
        ) : (
          <MobileMap
            places={recommendedPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
          />
        )}
      </View>

      <Text style={styles.header}>Recommended Places</Text>
      <View style={styles.recommendationsContainer}>
        {recommendedPlaces.length > 0 ? (
          recommendedPlaces.map((place, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.placeItem,
                selectedPlace === place ? styles.selectedPlaceItem : null,
              ]}
              onPress={() => handleSelectPlace(place)}
            >
              <View style={styles.placeItemHeader}>
                <Text style={styles.placeTitle}>{place.name}</Text>
              </View>
              <Text style={styles.placeDetails}>
                📍 Location: {place.location || "N/A"}
              </Text>
              <Text style={styles.placeDetails}>
                🏷 Category: {place.category || "N/A"}
              </Text>
              <Text style={styles.placeDetails}>
                🌏 Province: {place.province || "N/A"} Province
              </Text>
              <Text style={styles.placeDescription}>
                {place.description || "No description available."}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No recommendations available.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 10,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  categoryItem: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#0478A7",
    padding: 8,
    margin: 4,
    borderRadius: 20,
  },
  mapContainer: {
    height: 450,
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  interactiveMapButton: {
    backgroundColor: "#0478A7",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    alignItems: "center",
  },
  interactiveMapButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  recommendationsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  placeItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  placeItemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedPlaceItem: {
    borderWidth: 2,
    borderColor: "#0478A7",
    backgroundColor: "#f0f9ff",
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    flex: 1,
  },
  placeDetails: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
  },
  placeDescription: {
    fontSize: 14,
    color: "#333",
    marginTop: 6,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
