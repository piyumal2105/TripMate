import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { auth } from '../../configs/FirebaseConfig';
import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const db = getFirestore();

export default function Groups() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [showContent, setShowContent] = useState(false);
  const [hasGroupPreference, setHasGroupPreference] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [friends, setFriends] = useState(new Set());

  const fetchRecommendations = async (userId) => {
    setLoading(true);
    try {
      console.log('Fetching recommendations for userId:', userId);
      const response = await fetch(`http://localhost:8000/recommend/?uuid=${userId}`);
      const result = await response.json();
      console.log('Full API Response:', JSON.stringify(result, null, 2));
      setData(result);

      if (result.matchingUsers && result.matchingUsers.length > 0) {
        console.log('Matching Users found:', result.matchingUsers);
        const namePromises = result.matchingUsers.map(async (uuid) => {
          let userDoc, userData;
          for (let attempt = 0; attempt < 2; attempt++) {
            userDoc = await getDoc(doc(db, "users", uuid));
            if (userDoc.exists()) break;
            console.log(`Retry attempt ${attempt + 1} for user ${uuid} failed, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          if (userDoc.exists()) {
            userData = userDoc.data();
            console.log(`User ${uuid} name:`, userData.fullName || "Unknown User");
            return { uuid, name: userData.fullName || "Unknown User" };
          } else {
            console.log(`User ${uuid} not found in Firestore after retries`);
            return { uuid, name: "Unknown User (Not Found)" };
          }
        });

        const resolvedNames = await Promise.all(namePromises);
        const nameMap = resolvedNames.reduce((acc, { uuid, name }) => {
          acc[uuid] = name;
          return acc;
        }, {});
        console.log('User Names Map:', nameMap);
        setUserNames(nameMap);
      } else {
        console.log('No matching users in API response');
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

  const checkGroupPreference = async (userId) => {
    try {
      const preferencesDoc = await getDoc(doc(db, "userPreferences", userId));
      if (preferencesDoc.exists()) {
        const prefs = preferencesDoc.data();
        const travelPreferences = prefs.travelPreferences || [];
        setHasGroupPreference(travelPreferences.includes("Group"));
      } else {
        setHasGroupPreference(false);
      }
    } catch (error) {
      console.error("Error checking group preference:", error);
      setHasGroupPreference(false);
    }
  };

  const checkSentRequests = (userId) => {
    try {
      const requestsRef = collection(db, 'friendRequests');
      const q = query(requestsRef, where('fromUserId', '==', userId), where('status', '==', 'pending'));
      return onSnapshot(q, (snapshot) => {
        const requestIds = new Set(snapshot.docs.map(doc => doc.data().toUserId));
        setSentRequests(requestIds);
      }, (error) => {
        console.error('Error listening to sent requests:', error);
      });
    } catch (error) {
      console.error('Error checking sent requests:', error);
      return () => {}; // Return empty cleanup function on error
    }
  };

  useEffect(() => {
    let unsubscribeFriends = () => {};
    let unsubscribeRequests = () => {};
    let unsubscribeAuth = () => {};

    unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      // Clean up previous listeners before setting new ones
      unsubscribeFriends();
      unsubscribeRequests();

      if (user) {
        const userId = user.uid;
        setCurrentUserId(userId);
        console.log('User signed in:', userId);
        if (showContent) {
          if (hasGroupPreference) {
            fetchRecommendations(userId);
          }
        } else {
          await checkGroupPreference(userId);
        }
        const friendsRef = collection(db, 'friends', userId, 'friendList');
        unsubscribeFriends = onSnapshot(friendsRef, (snapshot) => {
          const friendIds = new Set(snapshot.docs.map(doc => doc.data().friendId));
          setFriends(friendIds);
        }, (error) => {
          console.error('Error listening to friends:', error);
        });
        unsubscribeRequests = checkSentRequests(userId);
      } else {
        console.log('User is not logged in');
        setData({ error: 'User not logged in' });
        setLoading(false);
        setHasGroupPreference(null);
        setFriends(new Set());
        setSentRequests(new Set());
        setUserNames({});
        setCurrentUserId(null);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [showContent, hasGroupPreference]);

  const handleSmartConnectClick = () => {
    setShowContent(true);
  };

  const handleRediscoverClick = () => {
    if (currentUserId) {
      fetchRecommendations(currentUserId);
    } else {
      console.log('No user logged in for rediscovery');
      setData({ error: 'User not logged in' });
    }
  };

  const handleGoToProfile = () => {
    window.location.href = "/UserProfileScreen/UserProfileScreen";
  };

  const sendFriendRequest = async (toUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !toUserId) {
      Alert.alert('Error', 'You must be logged in to send a friend request');
      return;
    }

    if (toUserId === currentUser.uid) {
      Alert.alert('Error', 'You cannot send a friend request to yourself');
      return;
    }

    if (friends.has(toUserId)) {
      Alert.alert('Info', 'This user is already your friend');
      return;
    }

    try {
      const sentRequestsQuery = await getDocs(query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      ));
      if (!sentRequestsQuery.empty) {
        Alert.alert('Info', 'You have already sent a friend request to this user');
        return;
      }

      const requestData = {
        fromUserId: currentUser.uid,
        toUserId,
        status: 'pending',
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'friendRequests'), requestData);
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  };

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

  if (loading || hasGroupPreference === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0478A7" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Suggested Travellers for You</Text>
      <View style={styles.card}>
        {data?.matchingUsers?.length > 0 && Object.keys(userNames).length > 0 ? (
          data.matchingUsers
            .filter((uuid) => userNames[uuid])
            .slice(0, 5)
            .map((uuid, index) => (
              <View key={index} style={styles.userItem}>
                <Text style={styles.userName}>{userNames[uuid]}</Text>
                <TouchableOpacity
                  style={styles.addFriendButton}
                  onPress={() => sendFriendRequest(uuid)}
                  disabled={friends.has(uuid) || sentRequests.has(uuid)}
                >
                  <Ionicons
                    name={friends.has(uuid) ? "people" : sentRequests.has(uuid) ? "checkmark" : "person-add-outline"}
                    size={18}
                    color={friends.has(uuid) ? "#28a745" : sentRequests.has(uuid) ? "#28a745" : "#0478A7"}
                  />
                  <Text style={styles.addFriendButtonText}>
                    {friends.has(uuid) ? "Friends" : sentRequests.has(uuid) ? "Requested" : "Add Friend"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
        ) : (
          <Text style={styles.noDataText}>
            {data?.matchingUsers?.length === 0
              ? "No matching travelers found. Try updating your preferences to find better matches!"
              : "Some traveler names are unavailable (e.g., 'Unknown User'). This may be due to missing data. Try refreshing or contact support if the issue persists."}
          </Text>
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

      <TouchableOpacity style={styles.rediscoverButton} onPress={handleRediscoverClick}>
        <Ionicons name="refresh-outline" size={24} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.rediscoverButtonText}>Discover Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0478A7',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0478A7',
  },
  addFriendButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0478A7',
    marginLeft: 5,
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