import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import axios from "axios";
import { auth } from "../../configs/FirebaseConfig.js";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

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

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }}></div>
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
      const response = await axios.post("http://localhost:8000/predict/", {
        categories,
      });
      console.log("API Response:", response.data.recommended_places);
      setRecommendedPlaces(response.data.recommended_places);
      setLoading(false);
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to fetch recommended places.");
      setLoading(false);
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

      {/* Map View */}
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
          <View style={styles.webMapPlaceholder}>
            <Text style={styles.placeholderText}>
              Map view is optimized for web in this version.
            </Text>
          </View>
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
              {/* <Text style={styles.placeDetails}>
                📊 Coordinates:{" "}
                {place.latitude !== undefined ? place.latitude : "N/A"},{" "}
                {place.longitude !== undefined ? place.longitude : "N/A"}
              </Text> */}
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
  webMapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
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
  placeItemIcon: {
    marginRight: 8,
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
