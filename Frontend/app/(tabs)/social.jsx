

import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, FlatList, Dimensions, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {  addDoc, updateDoc, doc, deleteDoc, increment} from '../../configs/FirebaseConfig';
import { IconButton } from 'react-native-paper';
import { onSnapshot, collection } from "firebase/firestore"; // Correct imports
import { db } from "../../configs/FirebaseConfig"; // Assuming 'db' is initialized correctly


// Get the screen width dynamically
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
      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), {
          text: postText,
          imageUri: imageUri || null,
        });
        setEditingPost(null);
      } else {
        await addDoc(collection(db, 'posts'), {
          text: postText,
          imageUri: imageUri || null,
          createdAt: new Date(),
          likes: 0, // Initialize likes
        });
      }

      setPostText('');
      setImageUri(null);
      setModalVisible(false);
    } catch (error) {
      console.error('Error submitting post: ', error);
    }
  };

  const handleLikePost = async (postId, currentLikes) => {
    try {
      const postRef = doc(db, "posts", postId); 
      await updateDoc(postRef, {
        likes: increment(1), 
      });
      console.log("Post liked successfully!");
    } catch (error) {
      console.error("Error liking post: ", error);
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
      {/* Add Post Input */}
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <TextInput
          placeholder="What's on your mind?"
          editable={false}
          style={styles.fakeInput}
        />
      </TouchableOpacity>
      
      {/* Post Feed */}
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
                <Text style={styles.username}>{item.username || 'User'}</Text>
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
                {/* Like Button */}
                <TouchableOpacity onPress={() => handleLikePost(item.id)}>
  <IconButton icon="heart" size={24} color="#ff3b30" />
</TouchableOpacity>
<Text>{item.likes || 0} likes</Text>

              </View>
              <View style={styles.editDeleteActions}>
                {/* Edit Button */}
                <TouchableOpacity onPress={() => handleEditPost(item)}>
                  <IconButton icon="pencil" size={20} color="#008CBA" />
                </TouchableOpacity>
                {/* Delete Button */}
                <TouchableOpacity onPress={() => handleDeletePost(item.id)}>
                  <IconButton icon="delete" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Modal for Adding Post */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  fakeInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  textInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: screenWidth * 0.9,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  addPostButton: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  postContainer: {
    backgroundColor: 'white',
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postText: {
    fontSize: 16,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editDeleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  noPostsText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20,
    fontSize: 16,
  },
});

export default PostFeed;
