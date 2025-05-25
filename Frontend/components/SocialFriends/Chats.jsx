import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, where, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { styles } from '../../app/styles/socialStyles'; // Adjust the import path as necessary

const Chat = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user for fetching friends');
        return;
      }

      const friendsRef = collection(db, 'friends', currentUser.uid, 'friendList');
      const snapshot = await getDocs(friendsRef);
      const friendList = snapshot.docs.map(doc => doc.data().friendId);

      const friendDetails = [];
      for (const friendId of friendList) {
        const userRef = doc(db, 'users', friendId);
        const userDoc = await getDoc(userRef);
        const fullName = userDoc.exists() ? userDoc.data().fullName || 'Anonymous' : 'Anonymous';
        friendDetails.push({ id: friendId, fullName });
      }
      setFriends(friendDetails);
    };
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!selectedFriend) return;

    const currentUser = auth.currentUser;
    const chatId = [currentUser.uid, selectedFriend.id].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchedMessages);
    }, (error) => {
      console.error('Error fetching messages:', error.message);
    });

    return () => unsubscribe();
  }, [selectedFriend]);

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Please enter a message');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !selectedFriend) {
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    const chatId = [currentUser.uid, selectedFriend.id].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    try {
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        text: newMessage,
        createdAt: new Date(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error.message, 'Stack:', error.stack);
      Alert.alert('Error', 'Failed to send message: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <View style={styles.container}>
      {!selectedFriend ? (
        <>
          <Text style={styles.username}>Your Friends</Text>
          {friends.length === 0 ? (
            <Text style={styles.noPostsText}>No friends yet</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.postContainer}
                  onPress={() => setSelectedFriend(item)}
                >
                  <Text style={styles.username}>{item.fullName}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => setSelectedFriend(null)}>
            <Text style={styles.cancelButton}>Back to Friends</Text>
          </TouchableOpacity>
          <Text style={styles.username}>Chat with {selectedFriend.fullName}</Text>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.postContainer,
                  item.senderId === auth.currentUser.uid
                    ? styles.messageSent
                    : styles.messageReceived,
                ]}
              >
                <Text style={styles.postText}>{item.text}</Text>
                <Text style={styles.postTime}>
                  {item.createdAt?.toDate().toLocaleTimeString()}
                </Text>
              </View>
            )}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.modalButton} onPress={sendMessage}>
            <Text style={styles.addPostButton}>Send</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default Chat;