import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../configs/FirebaseConfig.js";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore();

const SummaryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Parse the parameters and initialize state
  const parseParam = (param) => {
    if (!param) return [];
    if (Array.isArray(param)) return param;
    if (typeof param === "string") {
      if (!param.includes(",")) return [param];
      return param.split(",");
    }
    return [];
  };

  // Initialize state
  const [travelPreferences, setTravelPreferences] = useState(() =>
    parseParam(params.travelPreferences)
  );
  const [travelCategories, setTravelCategories] = useState(() =>
    parseParam(params.travelCategories)
  );
  const [tripDurations, setTripDurations] = useState(() =>
    parseParam(params.tripDurations)
  );
  const [selectedFeatures, setSelectedFeatures] = useState(() =>
    parseParam(params.selectedFeatures)
  );

  // Check authentication state when component mounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        console.log("User is signed in:", user.uid);
      } else {
        // User is signed out
        console.log("No user is signed in");
        // Redirect to login if no user is found
        router.replace("/login");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Update state if params change, but prevent unnecessary updates
  useEffect(() => {
    setTravelPreferences((prevPrefs) => {
      const newPrefs = parseParam(params.travelPreferences);
      return JSON.stringify(newPrefs) !== JSON.stringify(prevPrefs)
        ? newPrefs
        : prevPrefs;
    });

    setTravelCategories((prevCats) => {
      const newCats = parseParam(params.travelCategories);
      return JSON.stringify(newCats) !== JSON.stringify(prevCats)
        ? newCats
        : prevCats;
    });

    setTripDurations((prevDurs) => {
      const newDurs = parseParam(params.tripDurations);
      return JSON.stringify(newDurs) !== JSON.stringify(prevDurs)
        ? newDurs
        : prevDurs;
    });

    setSelectedFeatures((prevFeats) => {
      const newFeats = parseParam(params.selectedFeatures);
      return JSON.stringify(newFeats) !== JSON.stringify(prevFeats)
        ? newFeats
        : prevFeats;
    });
  }, [params]);

  // Function to save preferences to Firebase
  const savePreferencesToFirebase = async () => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to save preferences.");
      router.replace("/login");
      return;
    }

    setLoading(true);

    try {
      // Prepare user preferences object
      const userPreferences = {
        travelPreferences,
        travelCategories,
        tripDurations,
        socialFeatures: selectedFeatures,
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore under user's UID
      await setDoc(
        doc(db, "userPreferences", currentUser.uid),
        userPreferences
      );

      console.log("Preferences saved successfully for user:", currentUser.uid);

      Alert.alert("Success", "Your travel preferences have been saved!", [
        { text: "OK", onPress: () => router.push("auth/sign-in") },
      ]);

      router.push("auth/sign-in");
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to remove an item from a specific category
  const removeItem = (item, category) => {
    console.log(`Removing ${item} from ${category}`);

    // Create a new params object for updates
    let updatedParams = { ...params }; // Copy all existing params first

    // Update the state and prepare updated URL params
    if (category === "travelPreferences") {
      const newPrefs = travelPreferences.filter((pref) => pref !== item);
      setTravelPreferences(newPrefs);
      if (newPrefs.length > 0) {
        updatedParams.travelPreferences = newPrefs.join(",");
      } else {
        delete updatedParams.travelPreferences; // Delete if no preferences left
      }
    } else if (category === "travelCategories") {
      const newCats = travelCategories.filter((cat) => cat !== item);
      setTravelCategories(newCats);
      if (newCats.length > 0) {
        updatedParams.travelCategories = newCats.join(",");
      } else {
        delete updatedParams.travelCategories;
      }
    } else if (category === "tripDurations") {
      const newDurs = tripDurations.filter((dur) => dur !== item);
      setTripDurations(newDurs);
      if (newDurs.length > 0) {
        updatedParams.tripDurations = newDurs.join(",");
      } else {
        delete updatedParams.tripDurations;
      }
    } else if (category === "selectedFeatures") {
      const newFeats = selectedFeatures.filter((feat) => feat !== item);
      setSelectedFeatures(newFeats);
      if (newFeats.length > 0) {
        updatedParams.selectedFeatures = newFeats.join(",");
      } else {
        delete updatedParams.selectedFeatures;
      }
    }

    // Update the URL with the new parameters
    console.log("Updating URL params to:", updatedParams);
    router.setParams(updatedParams);
  };

  // Display each selected option as a tag with a remove button
  const renderTags = (items, category) => {
    if (!items || items.length === 0) {
      return <Text style={styles.noSelectionText}>None selected</Text>;
    }

    return (
      <View style={styles.tagsContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.tagWrapper}>
            <Text style={styles.tagText}>{item}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item, category)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#0478A7" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Your Travel Preferences</Text>

      <ScrollView contentContainerStyle={styles.summaryContainer}>
        {/* Travel Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Preferences:</Text>
          {renderTags(travelPreferences, "travelPreferences")}
        </View>

        {/* Travel Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Travel Categories:</Text>
          {renderTags(travelCategories, "travelCategories")}
        </View>

        {/* Trip Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Trip Duration:</Text>
          {renderTags(tripDurations, "tripDurations")}
        </View>

        {/* Social Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Social Features:</Text>
          {renderTags(selectedFeatures, "selectedFeatures")}
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          loading && { backgroundColor: "#a0a0a0" }, // Dim button when loading
        ]}
        onPress={savePreferencesToFirebase}
        disabled={loading}
      >
        <Text style={styles.confirmButtonText}>
          {loading ? "Saving..." : "Confirm Preferences"}
        </Text>
      </TouchableOpacity>

      {/* Re-enter Preferences Button */}
      <TouchableOpacity
        style={styles.reenterButton}
        onPress={() =>
          router.push("TravelPreferenceScreens/TravelPreferenceScreen")
        }
        disabled={loading}
      >
        <Text style={styles.reenterButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1000,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 80,
    marginBottom: 5,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  summaryContainer: {
    paddingVertical: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0478A7",
    marginBottom: 10,
  },
  noSelectionText: {
    fontSize: 16,
    color: "#888",
    fontStyle: "italic",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagWrapper: {
    backgroundColor: "#e6f3f7",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: "#0478A7",
    flexDirection: "row",
    alignItems: "center",
  },
  tagText: {
    color: "#0478A7",
    fontSize: 14,
    marginRight: 6,
  },
  removeButton: {
    padding: 2,
  },
  confirmButton: {
    backgroundColor: "#0478A7",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  reenterButton: {
    borderWidth: 1,
    borderBlockColor: "#0478A7",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  reenterButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SummaryScreen;
