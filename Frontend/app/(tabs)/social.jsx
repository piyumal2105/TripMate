import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, FlatList, Dimensions, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { addDoc, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { IconButton } from 'react-native-paper';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { supabase } from '../../configs/SupabaseConfig';
import { styles } from '../styles/socialStyles';

const formatTimeSince = (createdAt) => {
  if (!createdAt) return 'Just now';
  const now = new Date();
  const postDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const diffInMs = now - postDate;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else {
    const options = { day: 'numeric', month: 'short' };
    return postDate.toLocaleDateString('en-US', options);
  }
};

const screenWidth = Dimensions.get('window').width;

const PostFeed = () => {
  const [postText, setPostText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        exif: true, // Include metadata
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        console.log('Picked image:', {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
        setImageUri(asset.uri);
      } else {
        console.log('User cancelled image picker');
      }
    } catch (error) {
      console.error('Error picking image:', error.message, 'Stack:', error.stack);
      alert('Failed to pick image. Please try again.');
    }
  };

  const getFileExtension = (uri, mimeType) => {
    // First, try mimeType
    if (mimeType) {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg';
      if (mimeType.includes('png')) return 'png';
    }
    // Fallback to URI
    const uriParts = uri.split('.');
    if (uriParts.length > 1) {
      const ext = uriParts.pop().toLowerCase();
      if (['jpg', 'jpeg', 'png'].includes(ext)) return ext;
    }
    // Default to jpeg if unknown (for web Blobs)
    console.warn('Unknown extension, defaulting to jpeg');
    return 'jpeg';
  };

  const uploadImageToStorage = async (uri, userId, mimeType) => {
    try {
      console.log('Starting image upload for URI:', uri, 'User ID:', userId, 'MimeType:', mimeType);
      const extension = getFileExtension(uri, mimeType);
      console.log('Determined file extension:', extension);
      if (!['jpg', 'jpeg', 'png'].includes(extension)) {
        console.log('Unsupported file format:', extension);
        alert('Only JPEG and PNG images are supported');
        throw new Error('Unsupported file format');
      }
      const contentType = `image/${extension === 'png' ? 'png' : 'jpeg'}`;
      const format = extension === 'png' ? 'png' : 'jpeg';
      const fileName = `posts/${userId}/${Date.now()}.${extension}`;
      console.log('File name:', fileName, 'Content type:', contentType);
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format }
      );
      console.log('Compressed image URI:', manipulatedImage.uri, 'Size:', manipulatedImage.width, 'x', manipulatedImage.height);
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      const { error } = await supabase.storage
        .from('posts')
        .upload(fileName, blob, {
          contentType,
        });
      if (error) {
        console.error('Supabase upload error:', error.message, 'Details:', JSON.stringify(error));
        alert('Upload failed: ' + error.message);
        throw new Error(`Upload failed: ${error.message}`);
      }
      console.log('Image uploaded successfully to:', fileName);
      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);
      console.log('Public URL:', data.publicUrl);
      if (!data.publicUrl) {
        console.error('Failed to get public URL for:', fileName);
        alert('Failed to get public URL');
        throw new Error('Failed to get public URL');
      }
      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadImageToStorage:', error.message, 'Stack:', error.stack);
      alert('Upload failed: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  const handlePostSubmit = async () => {
    if (postText.trim() === '') {
      console.log('Post text is empty');
      alert('Please write something to post!');
      return;
    }

    try {
      const user = auth.currentUser;
      console.log('Current user:', user ? user.uid : 'None');
      if (!user) {
        console.log('No authenticated user');
        alert('You must be logged in to post');
        return;
      }
      const username = user.displayName || 'Anonymous';
      console.log('Username:', username);
      let downloadURL = null;

      if (imageUri) {
        console.log('Uploading image for post');
        // Pass mimeType from ImagePicker result (stored in state or refetch)
        downloadURL = await uploadImageToStorage(imageUri, user.uid, null); // Update if mimeType is stored
        console.log('Image uploaded, downloadURL:', downloadURL);
      } else {
        console.log('No image to upload');
      }

      console.log('Preparing Firestore data:', {
        text: postText,
        imageUri: downloadURL || null,
        username,
        categories: selectedCategories,
        userId: user.uid,
        createdAt: new Date(),
        likes: 0,
        likedBy: [],
      });

      if (editingPost) {
        console.log('Updating post ID:', editingPost.id);
        await updateDoc(doc(db, 'posts', editingPost.id), {
          text: postText,
          imageUri: downloadURL || null,
          username,
          categories: selectedCategories,
        });
        console.log('Post updated successfully');
        setEditingPost(null);
      } else {
        console.log('Creating new post');
        const docRef = await addDoc(collection(db, 'posts'), {
          text: postText,
          imageUri: downloadURL || null,
          createdAt: new Date(),
          likes: 0,
          likedBy: [],
          username,
          userId: user.uid,
          categories: selectedCategories,
        });
        console.log('New post created, ID:', docRef.id);
      }

      console.log('Resetting form state');
      setPostText('');
      setImageUri(null);
      setSelectedCategories([]);
      setModalVisible(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error in handlePostSubmit:', error.message, 'Stack:', error.stack);
      alert('Failed to submit post: ' + (error.message || 'Unknown error'));
      throw error;
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
      alert('Failed to like post. Please try again.');
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setPostText(post.text);
    setImageUri(post.imageUri);
    setSelectedCategories(post.categories || []);
    setModalVisible(true);
  };

  const handleDeletePost = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const post = postSnap.data();
        if (post.imageUri) {
          const filePath = post.imageUri.split('/posts/')[1];
          await supabase.storage.from('posts').remove([filePath]);
        }
        await deleteDoc(postRef);
      }
    } catch (error) {
      console.error('Error deleting post: ', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const categories = ['Solo', 'Couple', 'Family', 'Nature', 'Wildlife', 'Mountains', 'Beaches', 'Adventure', 'Culture', 'religous'];
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
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
                <View>
                  <Text style={styles.username}>
                    {item.username || 'User'}
                  </Text>
                  <Text style={styles.postTime}>
                    {formatTimeSince(item.createdAt)}
                  </Text>
                </View>
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
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategories.includes(category) && styles.categorySelected,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false);
                  setPostText('');
                  setImageUri(null);
                  setEditingPost(null);
                  setSelectedCategories([]);
                }}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePostSubmit}
              >
                <Text style={styles.addPostButton}>
                  {editingPost ? 'Update' : 'Add Post'}
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