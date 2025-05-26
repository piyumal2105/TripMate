import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { styles } from '../../app/styles/socialStyles'; // Adjust the import path as necessary

const AddFriend = () => {
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No authenticated user for fetching friend requests');
      return;
    }

    const requestsRef = collection(db, 'friendRequests');
    const q = query(requestsRef, where('toUserId', '==', currentUser.uid), where('status', '==', 'pending'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const requestsWithNames = [];
      
      for (const request of requests) {
        console.log('Fetching user for fromUserId:', request.fromUserId); // Debug: Log the user being fetched
        const userRef = doc(db, 'users', request.fromUserId);
        const userDoc = await getDoc(userRef);
        let fullName = 'Unknown User';
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data fetched:', userData); // Debug: Log the user data
          fullName = userData.fullName || 'Unknown User';
        } else {
          console.warn('No user document found for fromUserId:', request.fromUserId);
        }
        requestsWithNames.push({ ...request, fromFullName: fullName });
      }
      
      setFriendRequests(requestsWithNames);
    }, (error) => {
      console.error('Error fetching friend requests:', error.message, 'Stack:', error.stack);
    });

    return () => unsubscribe();
  }, []);

  const handleRequest = async (requestId, status) => {
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      await updateDoc(requestRef, { status });

      if (status === 'accepted') {
        const request = friendRequests.find(req => req.id === requestId);
        const currentUser = auth.currentUser;

        await addDoc(collection(db, 'friends', currentUser.uid, 'friendList'), {
          friendId: request.fromUserId,
          addedAt: new Date(),
        });
        await addDoc(collection(db, 'friends', request.fromUserId, 'friendList'), {
          friendId: currentUser.uid,
          addedAt: new Date(),
        });

        Alert.alert('Success', 'Friend request accepted!');
      } else {
        Alert.alert('Success', 'Friend request rejected.');
      }
    } catch (error) {
      console.error('Error handling friend request:', error.message, 'Stack:', error.stack);
      Alert.alert('Error', 'Failed to handle friend request: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.username}>Friend Requests</Text>
      {friendRequests.length === 0 ? (
        <Text style={styles.noPostsText}>No pending friend requests</Text>
      ) : (
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              <Text style={styles.username}>{item.fromFullName}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleRequest(item.id, 'accepted')}
                >
                  <Text style={styles.addPostButton}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleRequest(item.id, 'rejected')}
                >
                  <Text style={styles.cancelButton}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default AddFriend;