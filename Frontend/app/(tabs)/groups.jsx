import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { auth } from '../../configs/FirebaseConfig';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const db = getFirestore();

export default function Groups() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userId = user.uid;
        console.log("User is signed in:", userId);

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
              acc[uuid] = name;
              return acc;
            }, {});
            setUserNames(nameMap);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setData({ error: 'Failed to fetch data' });
        } finally {
          setLoading(false);
        }
      } else {
        console.log('User is not logged in');
        setData({ error: 'User not logged in' });
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0478A7" />
        <Text style={styles.loadingText}>Loading your recommendations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Suggested Travellers for You</Text>
      <View style={styles.card}>
        {data?.matchingUsers?.length > 0 ? (
          data.matchingUsers.map((uuid, index) => (
            <View key={index} style={styles.userItem}>
              <Text style={styles.userName}>{userNames[uuid] || uuid}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa', // Light gray background for a clean look
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at the bottom for scroll
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
    color: '#0478A7', // Matching your app's accent color
    fontFamily: 'sans-serif-medium', // Optional: Use a custom font if available
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
    elevation: 3, // Shadow for Android
  },
  userItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#e6f3f7', // Light blue for user items
    borderRadius: 8,
    marginVertical: 5,
    
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0478A7', // Accent color for names
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
});