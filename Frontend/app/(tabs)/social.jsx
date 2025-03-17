import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, FlatList, Dimensions, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { IconButton } from 'react-native-paper';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { styles } from '../styles/socialStyles';

const screenWidth = Dimensions.get('window').width;

const PostFeed = () => {
  const [postText, setPostText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, []);

  const handlePostSubmit = async () => {
    if (postText.trim() === '') {
      alert('Please write something to post!');
      return;
    }

    try {
      const user = auth.currentUser;
      const username = user ? user.displayName : 'Anonymous';

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), {
          text: postText,
          imageUri: imageUri || null,
          username: username,
        });
        setEditingPost(null);
      } else {
        await addDoc(collection(db, 'posts'), {
          text: postText,
          imageUri: imageUri || null,
          createdAt: new Date(),
          likes: 0,
          likedBy: [], // Initialize likedBy as an empty array
          username: username,
          userId: user.uid, // Store the userId when creating a post
        });
      }

      setPostText('');
      setImageUri(null);
      setModalVisible(false);
    } catch (error) {
      console.error('Error submitting post: ', error);
    }
  };

  const handleLikePost = async (postId, likedBy) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('You must be logged in to like a post');
      return;
    }

    const userId = currentUser.uid;
    const postRef = doc(db, 'posts', postId);

    try {
      const currentLikedBy = likedBy || [];

      if (currentLikedBy.includes(userId)) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(userId),
          likes: currentLikedBy.length - 1,
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(userId),
          likes: currentLikedBy.length + 1,
        });
      }
    } catch (error) {
      console.error('Error updating likes: ', error);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setPostText(post.text);
    setImageUri(post.imageUri);
    setModalVisible(true);
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Error deleting post: ', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      } else {
        console.log('User cancelled image picker');
      }
    } catch (error) {
      console.error('Error picking image: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <TextInput
          placeholder="What's on your mind?"
          editable={false}
          style={styles.fakeInput}
        />
      </TouchableOpacity>

      {posts.length === 0 ? (
        <Text style={styles.noPostsText}>No posts available</Text>
      ) : (
        <FlatList
          data={posts}
          style={styles.postList}
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: item.profilePicture || 'https://placekitten.com/40/40' }}
                  style={styles.profilePicture}
                />
                <Text style={styles.username}>
                  {item.username || 'User'}
                </Text>
              </View>

              <Text style={styles.postText}>{item.text}</Text>
              {item.imageUri && (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.postImage}
                  resizeMode="contain"
                />
              )}

              <View style={styles.postActions}>
                <TouchableOpacity onPress={() => handleLikePost(item.id, item.likedBy)}>
                  <IconButton
                    icon={item.likedBy?.includes(auth.currentUser?.uid) ? 'heart' : 'heart-outline'}
                    size={24}
                    color={item.likedBy?.includes(auth.currentUser?.uid) ? '#ff3b30' : '#ccc'}
                  />
                </TouchableOpacity>
                <Text>{item.likes || 0} likes</Text>
              </View>

              {item.userId === auth.currentUser?.uid && (
                <View style={styles.editDeleteActions}>
                  <TouchableOpacity onPress={() => handleEditPost(item)}>
                    <IconButton icon="pencil" size={20} color="#008CBA" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePost(item.id)}>
                    <IconButton icon="delete" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.imagePickerIcon} onPress={pickImage}>
              <IconButton icon="camera" size={28} color="#007BFF" />
            </TouchableOpacity>
            <TextInput
              value={postText}
              onChangeText={setPostText}
              placeholder="What's on your mind?"
              multiline
              numberOfLines={4}
              style={styles.textInput}
            />
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false);
                  setPostText('');
                  setImageUri(null);
                  setEditingPost(null);
                }}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePostSubmit}
              >
                <Text style={styles.addPostButton}>
                  {editingPost ? 'Update Post' : 'Add Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PostFeed;
