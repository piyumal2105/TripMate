import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { auth } from "../../configs/FirebaseConfig.js"; // Adjust path as needed
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore();

export default function Maps() {
  const [travelCategories, setTravelCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check authentication status when component mounts
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        console.log("User authenticated:", user.uid);
        // Fetch user's travel categories
        fetchUserTravelCategories(user.uid);
      } else {
        // User is not signed in
        console.log("No user is signed in");
        setLoading(false);
        setError("User not authenticated. Please login.");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Function to fetch travel categories from Firestore
  const fetchUserTravelCategories = async (userId) => {
    try {
      setLoading(true);

      // First, try to get from userPreferences collection
      const userPreferencesDoc = await getDoc(
        doc(db, "userPreferences", userId)
      );

      if (
        userPreferencesDoc.exists() &&
        userPreferencesDoc.data().travelCategories
      ) {
        // User preferences document exists with travel categories
        setTravelCategories(userPreferencesDoc.data().travelCategories);
        console.log(
          "Travel categories fetched from userPreferences:",
          userPreferencesDoc.data().travelCategories
        );
      } else {
        // Try to get from users collection as fallback
        const userDoc = await getDoc(doc(db, "users", userId));

        if (userDoc.exists() && userDoc.data().travelCategories) {
          setTravelCategories(userDoc.data().travelCategories);
          console.log(
            "Travel categories fetched from users:",
            userDoc.data().travelCategories
          );
        } else {
          console.log("No travel categories found for user");
          setTravelCategories([]);
        }
      }
    } catch (error) {
      console.error("Error fetching travel categories:", error);
      setError("Failed to load travel categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0478A7" />
        <Text style={styles.loadingText}>
          Loading your travel preferences...
        </Text>
      </View>
    );
  }

  // Show error message
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Show empty state
  if (travelCategories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>No travel categories found.</Text>
        <Text>Please update your preferences in your profile.</Text>
      </View>
    );
  }

  // Show travel categories
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Travel Categories</Text>
      <View style={styles.categoriesContainer}>
        {travelCategories.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        ))}
      </View>

      {/* Your map implementation will go here */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Map will be displayed here</Text>
        <Text style={styles.subText}>Filtered by your travel categories</Text>
      </View>
    </View>
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
    marginTop: 60,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  categoryItem: {
    backgroundColor: "#e6f3f7",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: "#0478A7",
  },
  categoryText: {
    color: "#0478A7",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#0478A7",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 10,
    textAlign: "center",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "500",
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
