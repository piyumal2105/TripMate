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
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../configs/FirebaseConfig.js";
import { getDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { supabase } from "../../configs/SupabaseConfig.js"
import defaultUserImage from "../../assets/images/profilepicture.png";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";



const UserProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editProfilePicture, setEditProfilePicture] = useState(null);
  const [editBase64Image, setEditBase64Image] = useState(null);
  // States for editable preferences
  const [editTravelPreferences, setEditTravelPreferences] = useState([]);
  const [editTravelCategories, setEditTravelCategories] = useState([]);
  const [editTripDurations, setEditTripDurations] = useState([]);
  const [editSocialFeatures, setEditSocialFeatures] = useState([]);

  // Predefined options matching signup screens
  const travelPreferenceOptions = ["Solo", "Group", "Family"];
  const travelCategoryOptions = [
    "Beaches",
    "Colonial Towns",
    "Cultural/Heritage Sites",
    "Gardens",
    "Hill Stations",
    "Museums",
    "Natural Attractions",
    "Tea Plantations",
    "Temples",
    "Wildlife/National Parks",
    "Mountains",
    "Hiking",
    "Adventure Sports",
  ];
  const tripDurationOptions = ["Weekdays", "Weekend", "Holidays"];
  const socialFeatureOptions = ["Photos", "Reels", "Blogs"];

  // Check authentication and load user data when component mounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("User is signed in:", user.uid);

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
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
            setEditFullName(firestoreUserData.fullName || user.displayName || "Traveler");
            setEditBase64Image(firestoreUserData.photoURL && typeof firestoreUserData.photoURL === "string" && firestoreUserData.photoURL.startsWith('http')
              ? firestoreUserData.photoURL // If it's a URL, keep it for display
              : null);
          } else {
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
            setEditFullName(user.displayName || formattedName);
            setEditBase64Image(user.photoURL && typeof user.photoURL === "string" && user.photoURL.startsWith('http')
              ? user.photoURL
              : null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
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
          setEditFullName(user.displayName || formattedName);
          setEditBase64Image(user.photoURL && typeof user.photoURL === "string" && user.photoURL.startsWith('http')
            ? user.photoURL
            : null);
        }

        fetchUserPreferences(user.uid);
      } else {
        console.log("No user is signed in");
        router.replace("auth/sign-in");
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to fetch user preferences from Firestore
  const fetchUserPreferences = async (userId) => {
    try {
      setLoading(true);
      const preferencesDoc = await getDoc(doc(db, "userPreferences", userId));

      if (preferencesDoc.exists()) {
        const prefs = preferencesDoc.data();
        setUserPreferences(prefs);
        // Initialize edit states with current preferences
        setEditTravelPreferences(prefs.travelPreferences || []);
        setEditTravelCategories(prefs.travelCategories || []);
        setEditTripDurations(prefs.tripDurations || []);
        setEditSocialFeatures(prefs.socialFeatures || []);
        console.log("User preferences fetched successfully");
      } else {
        console.log("No user preferences found");
        setUserPreferences(null);
        // Initialize edit states as empty
        setEditTravelPreferences([]);
        setEditTravelCategories([]);
        setEditTripDurations([]);
        setEditSocialFeatures([]);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      Alert.alert("Error", "Failed to load your travel preferences.");
    } finally {
      setLoading(false);
    }
  };

  // Function to pick and process a new profile picture
  const pickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        // Resize image to 100x100
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 100, height: 100 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setEditProfilePicture(manipulatedImage.uri);

        // Convert to base64 for temporary storage (optional, for display)
        const base64 = await ImageManipulator.manipulateAsync(
          manipulatedImage.uri,
          [],
          { base64: true }
        );
        setEditBase64Image(base64.base64);
      }
    } catch (error) {
      console.error("Error picking profile picture:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Function to upload image to Supabase Storage and get public URL
  const uploadImageToSupabase = async (uri, userId) => {
    try {
      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Define the file path in Supabase Storage
      const filePath = `profile-pictures/${userId}.jpg`;

      // Upload the image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image to Supabase:", error);
      throw new Error("Failed to upload image to Supabase.");
    }
  };

  // Toggle functions for preferences
  const toggleTravelPreference = (item) => {
    setEditTravelPreferences((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const toggleTravelCategory = (item) => {
    setEditTravelCategories((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const toggleTripDuration = (item) => {
    setEditTripDurations((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const toggleSocialFeature = (item) => {
    setEditSocialFeatures((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  // Function to save updated profile details and preferences
  const saveProfileChanges = async () => {
    if (!editFullName) {
      Alert.alert("Error", "Full name cannot be empty.");
      return;
    }

    try {
      let photoURL = null;

      // If a new image is selected, upload it to Supabase Storage
      if (editProfilePicture) {
        photoURL = await uploadImageToSupabase(editProfilePicture, currentUser.uid);
      }

      // Update Firestore user data
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: editFullName,
        photoURL: photoURL || null,
      });

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: editFullName,
        photoURL: photoURL, // Use the Supabase URL or null
      });

      // Update userPreferences in Firestore
      await setDoc(doc(db, "userPreferences", currentUser.uid), {
        travelPreferences: editTravelPreferences,
        travelCategories: editTravelCategories,
        tripDurations: editTripDurations,
        socialFeatures: editSocialFeatures,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Update local states
      setUserData({
        ...userData,
        displayName: editFullName,
        photoURL: photoURL || defaultUserImage, // Keep defaultUserImage for display if no new image
      });

      setUserPreferences({
        ...userPreferences,
        travelPreferences: editTravelPreferences,
        travelCategories: editTravelCategories,
        tripDurations: editTripDurations,
        socialFeatures: editSocialFeatures,
        updatedAt: new Date().toISOString(),
      });

      setEditModalVisible(false);
      Alert.alert("Success", "Profile and preferences updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
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

  // Function to render preference items (for display)
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

  // Function to render editable preference items (for modal)
  const renderEditablePreferenceItems = (items, selectedItems, toggleFunction, title) => {
    return (
      <View style={styles.preferenceContainer}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <View style={styles.tagsContainer}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tagWrapper,
                selectedItems.includes(item) && styles.tagSelected,
              ]}
              onPress={() => toggleFunction(item)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedItems.includes(item) && styles.tagTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
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
              userData?.photoURL && typeof userData.photoURL === "string" && userData.photoURL.startsWith("http")
                ? { uri: userData.photoURL }
                : defaultUserImage // Use the imported image asset directly
            }
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{userData?.displayName}</Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
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

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            {/* Profile Picture Picker */}
            <TouchableOpacity onPress={pickProfilePicture} style={{ alignItems: "center", marginBottom: 20 }}>
              {editProfilePicture ? (
                <Image
                  source={{ uri: editProfilePicture }}
                  style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "#0478A7" }}
                />
              ) : userData?.photoURL && typeof userData.photoURL === "string" && userData.photoURL.startsWith("http") ? (
                <Image
                  source={{ uri: userData.photoURL }}
                  style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "#0478A7" }}
                />
              ) : (
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#e0e0e0",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "#0478A7",
                }}>
                  <Ionicons name="camera" size={40} color="#666" />
                </View>
              )}
              <Text style={{ marginTop: 10, color: "#666" }}>Change Profile Picture</Text>
            </TouchableOpacity>

            {/* Full Name Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Full Name"
              value={editFullName}
              onChangeText={setEditFullName}
            />

            {/* Editable Preferences */}
            {renderEditablePreferenceItems(
              travelPreferenceOptions,
              editTravelPreferences,
              toggleTravelPreference,
              "Travel Style"
            )}
            {renderEditablePreferenceItems(
              travelCategoryOptions,
              editTravelCategories,
              toggleTravelCategory,
              "Travel Categories"
            )}
            {renderEditablePreferenceItems(
              tripDurationOptions,
              editTripDurations,
              toggleTripDuration,
              "Trip Duration"
            )}
            {renderEditablePreferenceItems(
              socialFeatureOptions,
              editSocialFeatures,
              toggleSocialFeature,
              "Social Features"
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveProfileChanges}
              >
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
  editButton: {
    backgroundColor: "#0478A7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutContainer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  logoutButtonBottomContainer: {
    flexDirection: "row",
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
  tagSelected: {
    backgroundColor: "#0478A7",
  },
  tagText: {
    color: "#0478A7",
    fontSize: 14,
  },
  tagTextSelected: {
    color: "white",
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    padding: 20,
    backgroundColor: "white",
    marginVertical: 50,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#0478A7",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    width: "100%",
  },
});

export default UserProfileScreen;