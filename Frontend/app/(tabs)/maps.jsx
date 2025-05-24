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
  Modal,
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

// 360° Street View Component
const StreetView360Modal = ({ place, visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [streetViewAvailable, setStreetViewAvailable] = useState(false);
  const streetViewRef = useRef(null);

  useEffect(() => {
    if (visible && place && Platform.OS === "web") {
      loadStreetView();
    }
  }, [visible, place]);

  const loadStreetView = () => {
    if (!place.latitude || !place.longitude) {
      setStreetViewAvailable(false);
      setLoading(false);
      return;
    }

    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setStreetViewAvailable(false);
      setLoading(false);
      return;
    }

    const createStreetViewIframe = () => {
      const iframe = document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.borderRadius = "10px";

      // Google Street View embed URL (works without API key for basic embedding)
      const streetViewUrl = `https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`;

      iframe.src = streetViewUrl;
      iframe.title = `360° View of ${place.name}`;

      iframe.onload = () => {
        setLoading(false);
        setStreetViewAvailable(true);
      };

      iframe.onerror = () => {
        setLoading(false);
        setStreetViewAvailable(false);
      };

      if (streetViewRef.current) {
        streetViewRef.current.innerHTML = "";
        streetViewRef.current.appendChild(iframe);
      }
    };

    createStreetViewIframe();
  };

  const openExternalStreetView = () => {
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const url = `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s0x0:0x0!2e0!7i13312!8i6656`;

      if (Platform.OS === "web") {
        window.open(url, "_blank");
      } else {
        Linking.openURL(url).catch((err) =>
          console.error("Failed to open Street View:", err)
        );
      }
    }
  };

  const WebStreetView = () => (
    <div style={{ width: "100%", height: "400px", position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            textAlign: "center",
          }}
        >
          <ActivityIndicator size="large" color="#0478A7" />
          <Text style={{ textAlign: "center", marginTop: 10, color: "#666" }}>
            Loading 360° View...
          </Text>
        </div>
      )}
      <div ref={streetViewRef} style={{ width: "100%", height: "100%" }}></div>
      {!loading && !streetViewAvailable && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.95)",
            padding: "20px",
            borderRadius: "10px",
            border: "1px solid #ddd",
          }}
        >
          <Text style={{ fontSize: 16, color: "#666", marginBottom: 10 }}>
            360° Street View not available for this exact location
          </Text>
          <TouchableOpacity
            style={styles.externalButton}
            onPress={openExternalStreetView}
          >
            <Text style={styles.externalButtonText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </div>
      )}
    </div>
  );

  const MobileStreetView = () => (
    <View style={styles.mobileContainer}>
      <Text style={styles.mobileText}>
        🌐 360° View is best experienced on web browsers
      </Text>
      <Text style={styles.mobileSubText}>
        Tap below to open in Google Maps for full 360° experience
      </Text>
      <TouchableOpacity
        style={styles.externalButton}
        onPress={openExternalStreetView}
      >
        <Text style={styles.externalButtonText}>
          Open Street View in Google Maps
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🌍 360° View - {place?.name}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.streetViewContainer}>
          {Platform.OS === "web" ? <WebStreetView /> : <MobileStreetView />}
        </View>

        <View style={styles.modalFooter}>
          <Text style={styles.footerText}>
            📍 {place?.location}, {place?.province} Province
          </Text>
          <Text style={styles.footerDescription}>{place?.description}</Text>
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={openExternalStreetView}
          >
            <Text style={styles.fullScreenButtonText}>
              🔍 Open in Full Screen
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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
                  ref={(ref) => (markerRefs.current[index] = ref)}
                  coordinate={{
                    latitude: lat,
                    longitude: lng,
                  }}
                  title={place.name}
                  description={place.category || "Tourist Destination"}
                  pinColor={selectedPlace === place ? "#0478A7" : "#FF0000"}
                  onPress={() => {
                    onSelectPlace(place);
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

  // New state for 360° view
  const [streetView360Visible, setStreetView360Visible] = useState(false);
  const [selectedPlaceFor360, setSelectedPlaceFor360] = useState(null);

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

  // New function to handle 360° view
  const handle360ViewOpen = (place) => {
    setSelectedPlaceFor360(place);
    setStreetView360Visible(true);
  };

  const handle360ViewClose = () => {
    setStreetView360Visible(false);
    setSelectedPlaceFor360(null);
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
                {/* New 360° View Button */}
                <TouchableOpacity
                  style={styles.view360Button}
                  onPress={() => handle360ViewOpen(place)}
                >
                  <Text style={styles.view360ButtonText}>🌍 360°</Text>
                </TouchableOpacity>
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

      {/* 360° Street View Modal */}
      <StreetView360Modal
        place={selectedPlaceFor360}
        visible={streetView360Visible}
        onClose={handle360ViewClose}
      />
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
    justifyContent: "space-between",
    marginBottom: 8,
  },
  selectedPlaceItem: {
    borderWidth: 2,
    borderColor: "#0478A7",
    backgroundColor: "#f0f9ff",
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
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
  // New styles for 360° feature
  view360Button: {
    backgroundColor: "#0478A7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  view360ButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#333",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f3f4",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  streetViewContainer: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  footerDescription: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    lineHeight: 20,
  },
  externalButton: {
    backgroundColor: "#0478A7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  externalButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  fullScreenButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  fullScreenButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  mobileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  mobileText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "500",
  },
  mobileSubText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
