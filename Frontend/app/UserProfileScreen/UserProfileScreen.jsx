import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../configs/FirebaseConfig.js";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import defaultUserImage from "../../assets/images/profilepicture.png";

// Initialize Firestore
const db = getFirestore();

const UserProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication and load user data when component mounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        console.log("User is signed in:", user.uid);

        // Try to fetch additional user data that might contain the name
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            // User document exists in Firestore - use this data
            const firestoreUserData = userDoc.data();
            setUserData({
              email: user.email,
              displayName:
                firestoreUserData.fullName ||
                firestoreUserData.displayName ||
                user.displayName ||
                "Traveler",
              photoURL:
                firestoreUserData.photoURL || user.photoURL || defaultUserImage,
              uid: user.uid,
            });
          } else {
            // No user document - check if we can get name from email
            const emailName = user.email
              ? user.email.split("@")[0]
              : "Traveler";
            const formattedName = emailName
              .split(/[._-]/)
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");

            setUserData({
              email: user.email,
              displayName: user.displayName || formattedName,
              photoURL: user.photoURL || defaultUserImage,
              uid: user.uid,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to auth user data
          const emailName = user.email ? user.email.split("@")[0] : "Traveler";
          const formattedName = emailName
            .split(/[._-]/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

          setUserData({
            email: user.email,
            displayName: user.displayName || formattedName,
            photoURL: user.photoURL || defaultUserImage,
            uid: user.uid,
          });
        }

        // Fetch user preferences
        fetchUserPreferences(user.uid);
      } else {
        // User is signed out
        console.log("No user is signed in");
        router.replace("auth/sign-in");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Function to fetch user preferences from Firestore
  const fetchUserPreferences = async (userId) => {
    try {
      setLoading(true);
      const preferencesDoc = await getDoc(doc(db, "userPreferences", userId));

      if (preferencesDoc.exists()) {
        setUserPreferences(preferencesDoc.data());
        console.log("User preferences fetched successfully");
      } else {
        console.log("No user preferences found");
        setUserPreferences(null);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      Alert.alert("Error", "Failed to load your travel preferences.");
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      router.replace("auth/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  // Function to render preference items
  const renderPreferenceItems = (items, title) => {
    if (!items || items.length === 0) {
      return (
        <View style={styles.emptyPreference}>
          <Text style={styles.emptyText}>No preferences selected</Text>
        </View>
      );
    }

    return (
      <View style={styles.preferenceContainer}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <View style={styles.tagsContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.tagWrapper}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0478A7" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back button at top */}
      <TouchableOpacity
        style={styles.backButtonContainer}
        onPress={() => router.push("/mytrip")}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={
              userData?.photoURL &&
              typeof userData.photoURL === "string" &&
              userData.photoURL.startsWith("http")
                ? { uri: userData.photoURL }
                : userData?.photoURL
            }
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{userData?.displayName}</Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
        </View>

        {/* Preferences Section */}
        <View style={styles.preferencesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Travel Preferences</Text>
          </View>

          {!userPreferences ? (
            <View style={styles.noPreferences}>
              <Text style={styles.noPreferencesText}>
                You haven't set any travel preferences yet.
              </Text>
            </View>
          ) : (
            <View style={styles.preferencesContainer}>
              {renderPreferenceItems(
                userPreferences.travelPreferences,
                "Travel Style"
              )}
              {renderPreferenceItems(
                userPreferences.travelCategories,
                "Travel Categories"
              )}
              {renderPreferenceItems(
                userPreferences.tripDurations,
                "Trip Duration"
              )}
              {renderPreferenceItems(
                userPreferences.socialFeatures,
                "Social Features"
              )}

              <Text style={styles.lastUpdated}>
                Last updated:{" "}
                {new Date(userPreferences.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Logout Button at bottom */}
      <View style={styles.logoutContainer} onPress={handleLogout}>
        <TouchableOpacity
          style={styles.logoutButtonBottomContainer}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#0478A7" />
          <Text style={styles.logoutBottomText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  loadingText: {
    marginTop: 10,
    color: "#0478A7",
    fontSize: 16,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  backButtonText: {
    marginLeft: 5,
    color: "#0478A7",
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#0478A7",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
    marginBottom: 15,
  },
  logoutContainer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  logoutButtonBottomContainer: {
    flexDirection: "row",
    // backgroundColor: "#0478A7",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  logoutBottomText: {
    color: "#0478A7",
    fontWeight: "600",
    fontSize: 18,
    marginLeft: 8,
  },
  preferencesSection: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  noPreferences: {
    alignItems: "center",
    padding: 20,
  },
  noPreferencesText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  preferencesContainer: {
    paddingTop: 5,
  },
  preferenceContainer: {
    marginBottom: 20,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0478A7",
    marginBottom: 8,
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
  },
  tagText: {
    color: "#0478A7",
    fontSize: 14,
  },
  emptyPreference: {
    padding: 10,
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 15,
    fontStyle: "italic",
  },
});

export default UserProfileScreen;
