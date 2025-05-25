import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, where, getDoc,setDoc, doc, limit } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { useRouter } from 'expo-router'; // For navigation
import AddFriend from '../SocialFriends/addfriend';

const Chat = () => {
  const router = useRouter(); // Add router for navigation
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Messages');

  // Helper function to format timestamp (similar to PostFeed.jsx)
  const formatTimeSince = (createdAt) => {
    if (!createdAt) return 'Just now';
    const now = new Date();
    const messageDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diffInMs = now - messageDate;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      const options = { day: 'numeric', month: 'short' };
      return messageDate.toLocaleDateString('en-US', options);
    }
  };

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
        const profilePicture = userDoc.exists() && userDoc.data().profilePicture
          ? userDoc.data().profilePicture
          : require('../../assets/images/profilepicture.png');

        // Fetch the latest message for this friend
        const chatId = [currentUser.uid, friendId].sort().join('_');
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
        const messageSnapshot = await getDocs(q);

        let lastMessage = 'Start a conversation';
        let timestamp = null;
        if (!messageSnapshot.empty) {
          const latestMessage = messageSnapshot.docs[0].data();
          lastMessage = latestMessage.text;
          timestamp = latestMessage.createdAt;
        }

        // Fetch unread message count for this friend
        const lastSeenRef = doc(db, 'lastSeen', `${currentUser.uid}_${friendId}`);
        let lastSeenTimestamp = null;
        const lastSeenDoc = await getDoc(lastSeenRef);
        if (lastSeenDoc.exists()) {
          lastSeenTimestamp = lastSeenDoc.data().timestamp?.toDate();
        }

        const unreadQuery = query(
          messagesRef,
          where('senderId', '==', friendId),
          where('createdAt', '>', lastSeenTimestamp || new Date(0))
        );
        const unreadSnapshot = await getDocs(unreadQuery);
        const unreadCount = unreadSnapshot.docs.length;

        friendDetails.push({
          id: friendId,
          fullName,
          profilePicture,
          lastMessage,
          timestamp: timestamp ? formatTimeSince(timestamp) : 'Just now',
          unreadCount,
        });
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

      // Update last seen timestamp when viewing the chat
      const lastSeenRef = doc(db, 'lastSeen', `${currentUser.uid}_${selectedFriend.id}`);
      setDoc(lastSeenRef, { timestamp: new Date() }, { merge: true });
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
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with Back Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: 'bold', color: '#000', fontSize: 18 }}>
          {activeTab === 'Messages' ? 'Messages' : 'Add Friend'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <TouchableOpacity
          style={{
            padding: 5,
            marginRight: 20,
            borderBottomWidth: activeTab === 'Messages' ? 2 : 0,
            borderBottomColor: activeTab === 'Messages' ? '#0095f6' : 'transparent',
          }}
          onPress={() => setActiveTab('Messages')}
        >
          <Text style={{ color: activeTab === 'Messages' ? '#0095f6' : '#000', fontWeight: 'bold' }}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            padding: 5,
            borderBottomWidth: activeTab === 'AddFriend' ? 2 : 0,
            borderBottomColor: activeTab === 'AddFriend' ? '#0095f6' : 'transparent',
          }}
          onPress={() => setActiveTab('AddFriend')}
        >
          <Text style={{ color: activeTab === 'AddFriend' ? '#0095f6' : '#000', fontWeight: 'bold' }}>
            Add Friend
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'Messages' ? (
        selectedFriend ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
              <TouchableOpacity onPress={() => setSelectedFriend(null)}>
                <Text style={{ fontSize: 18, marginRight: 10 }}>←</Text>
              </TouchableOpacity>
              <Image
                source={selectedFriend.profilePicture}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
              />
              <Text style={{ fontWeight: 'bold', color: '#000' }}>Chat with {selectedFriend.fullName}</Text>
            </View>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              
              style={{ flex: 1, padding: 10 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    { marginVertical: 5, maxWidth: '70%', padding: 10, borderRadius: 10 },
                    item.senderId === auth.currentUser.uid
                      ? { backgroundColor: '#0095f6', alignSelf: 'flex-end' }
                      : { backgroundColor: '#e0e0e0', alignSelf: 'flex-start' },
                  ]}
                >
                  <Text style={{ color: item.senderId === auth.currentUser.uid ? '#fff' : '#000' }}>
                    {item.text}
                  </Text>
                  <Text style={{ color: item.senderId === auth.currentUser.uid ? '#ddd' : '#666', fontSize: 12 }}>
                    {item.createdAt?.toDate().toLocaleTimeString()}
                  </Text>
                </View>
              )}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd' }}>
              <TextInput
                style={{ flex: 1, marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', padding: 8 }}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#0095f6', padding: 10, borderRadius: 20 }}
                onPress={sendMessage}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {friends.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No friends yet</Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => setSelectedFriend(item)}
                  >
                    <Image
                      source={item.profilePicture}
                      style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#000' }}>{item.fullName}</Text>
                      <Text style={{ color: '#666', fontSize: 14 }}>{item.lastMessage}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: '#666', fontSize: 12, marginRight: 10 }}>{item.timestamp}</Text>
                      {item.unreadCount > 0 && (
                        <View style={{ backgroundColor: '#0095f6', borderRadius: 10, padding: 2, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )
      ) : (
        <View style={{ flex: 1 }}>
          <AddFriend />
        </View>
      )}
    </View>
  );
};

export default Chat;