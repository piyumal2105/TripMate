import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../../configs/FirebaseConfig';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const db = getFirestore();

export default function Groups() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [showContent, setShowContent] = useState(false);
  const [hasGroupPreference, setHasGroupPreference] = useState(null); // New state to track "Group" preference
  const [currentUserId, setCurrentUserId] = useState(null);

  // Function to fetch recommendations
  const fetchRecommendations = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/recommend/?uuid=${userId}`);
      const result = await response.json();
      console.log('API Response:', result);
      setData(result);

      if (result.matchingUsers && result.matchingUsers.length > 0) {
        const namePromises = result.matchingUsers.map(async (uuid) => {
          const userDoc = await getDoc(doc(db, "users", uuid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return { uuid, name: userData.fullName || "Unknown User" };
          }
          return { uuid, name: "Unknown User" };
        });

        const resolvedNames = await Promise.all(namePromises);
        const nameMap = resolvedNames.reduce((acc, { uuid, name }) => {
          if (name !== "Unknown User") {
            acc[uuid] = name;
          }
          return acc;
        }, {});
        setUserNames(nameMap);
      } else {
        setUserNames({});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData({ error: 'Failed to fetch data' });
      setUserNames({});
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user has "Group" preference
  const checkGroupPreference = async (userId) => {
    try {
      const preferencesDoc = await getDoc(doc(db, "userPreferences", userId));
      if (preferencesDoc.exists()) {
        const prefs = preferencesDoc.data();
        const travelPreferences = prefs.travelPreferences || [];
        setHasGroupPreference(travelPreferences.includes("Group"));
      } else {
        setHasGroupPreference(false); // No preferences found, assume "Group" is not selected
      }
    } catch (error) {
      console.error("Error checking group preference:", error);
      setHasGroupPreference(false); // On error, assume "Group" is not selected
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userId = user.uid;
        setCurrentUserId(userId);
        console.log("User is signed in:", userId);
        if (showContent) {
          // Only fetch recommendations if "Group" preference is confirmed
          if (hasGroupPreference) {
            fetchRecommendations(userId);
          }
        } else {
          // When the component mounts or user changes, check the preference
          await checkGroupPreference(userId);
        }
      } else {
        console.log('User is not logged in');
        setData({ error: 'User not logged in' });
        setLoading(false);
        setHasGroupPreference(null);
      }
    });

    return () => unsubscribe();
  }, [showContent, hasGroupPreference]);

  const handleSmartConnectClick = () => {
    setShowContent(true);
  };

  const handleRediscoverClick = () => {
    if (currentUserId) {
      fetchRecommendations(currentUserId); // Re-run the API call
    } else {
      console.log('No user logged in for rediscovery');
      setData({ error: 'User not logged in' });
    }
  };

  const handleGoToProfile = () => {
    // Navigate to UserProfileScreen
    // Assuming the route is "/UserProfileScreen" based on your app structure
    // Adjust the path if needed
    window.location.href = "/UserProfileScreen/UserProfileScreen";
  };

  // Intro screen
  if (!showContent) {
    return (
      <View style={styles.introContainer}>
        <Text style={styles.introTitle}>Discover Your Travel Companions</Text>
        <Text style={styles.introDescription}>
          Find travelers with similar interests and explore destinations you can enjoy together. Click "Discover Now" to see personalized recommendations based on your preferences.
        </Text>
        <TouchableOpacity style={styles.smartConnectButton} onPress={handleSmartConnectClick}>
          <Ionicons name="sparkles-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.smartConnectButtonText}>Discover Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (loading || hasGroupPreference === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0478A7" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check if "Group" preference is selected
  if (!hasGroupPreference) {
    return (
      <View style={styles.noGroupContainer}>
        <Text style={styles.noGroupText}>
          You did not select Group as a travel preference. If you want, you can add it.
        </Text>
        <TouchableOpacity style={styles.goToProfileButton} onPress={handleGoToProfile}>
          <Ionicons name="person-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.goToProfileButtonText}>Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content if "Group" preference is selected
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Suggested Travellers for You</Text>
      <View style={styles.card}>
        {data?.matchingUsers?.length > 0 && Object.keys(userNames).length > 0 ? (
          data.matchingUsers
            .filter((uuid) => userNames[uuid]) // Only include users with valid names
            .slice(0, 5) // Limit to maximum 5 users
            .map((uuid, index) => (
              <View key={index} style={styles.userItem}>
                <Text style={styles.userName}>{userNames[uuid]}</Text>
              </View>
            ))
        ) : (
          <Text style={styles.noDataText}>No matching travelers found.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Destinations You can Travel Together</Text>
      <View style={styles.card}>
        {data?.recommendedPlaces?.length > 0 ? (
          data.recommendedPlaces.map((place, index) => (
            <View key={index} style={styles.placeCard}>
              <Text style={styles.placeName}>{place["Place Name"]}</Text>
              <Text style={styles.placeDetail}>Category: {place.Category}</Text>
              <Text style={styles.placeDetail}>Location: {place.Location}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No recommended places available.</Text>
        )}
      </View>

      {/* Re-Discover Button */}
      <TouchableOpacity style={styles.rediscoverButton} onPress={handleRediscoverClick}>
        <Ionicons name="refresh-outline" size={24} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.rediscoverButtonText}>Discover Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Intro Section Styles
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  introDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  smartConnectButton: {
    flexDirection: 'row',
    backgroundColor: '#0478A7',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  smartConnectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  // No Group Preference Styles
  noGroupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  noGroupText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  goToProfileButton: {
    flexDirection: 'row',
    backgroundColor: '#0478A7',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goToProfileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  // Existing Styles
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#0478A7',
    fontFamily: 'sans-serif-medium',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  userItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#e6f3f7',
    borderRadius: 8,
    marginVertical: 5,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0478A7',
  },
  placeCard: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#0478A7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  placeDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  rediscoverButton: {
    flexDirection: 'row',
    backgroundColor: '#0478A7',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  rediscoverButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});