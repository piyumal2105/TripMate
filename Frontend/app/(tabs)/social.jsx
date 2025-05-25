import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, FlatList, Dimensions, TouchableOpacity, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'expo-av';
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
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const user = auth.currentUser;
      if (user && userPreferences.length > 0) {
        console.log("Current User Preferences:", userPreferences);
        fetchedPosts.sort((a, b) => {
          // Define mapping from user preferences to post categories
          const preferenceToPostMap = {
            "Beaches": "Beaches",
            "Colonial Towns": "Culture",
            "Cultural/Heritage Sites": "Culture",
            "Gardens": "Nature",
            "Hill Stations": "Mountains",
            "Museums": "Culture",
            "Natural Attractions": "Nature",
            "Tea Plantations": "Nature",
            "Temples": "Temples",
            "Wildlife/National Parks": "Wildlife",
            "Mountains": "Mountains",
            "Hiking": "Adventure",
            "Adventure Sports": "Adventure"
          };

          // Calculate matches for post A
          const aMappedPrefs = userPreferences.map(pref => preferenceToPostMap[pref] || pref);
          const aMatches = a.categories?.filter(category => aMappedPrefs.includes(category))?.length || 0;

          // Calculate matches for post B
          const bMappedPrefs = userPreferences.map(pref => preferenceToPostMap[pref] || pref);
          const bMatches = b.categories?.filter(category => bMappedPrefs.includes(category))?.length || 0;

          console.log(`Post ${a.id} matches: ${aMatches}, Categories: ${a.categories}, Mapped Prefs: ${aMappedPrefs}`);
          console.log(`Post ${b.id} matches: ${bMatches}, Categories: ${b.categories}, Mapped Prefs: ${bMappedPrefs}`);

          if (aMatches !== bMatches) {
            return bMatches - aMatches; // Higher matches first
          }

          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return bDate - aDate; // Newer posts first if match counts are equal
        });
      } else {
        fetchedPosts.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return bDate - aDate; // Default to newest first
        });
      }

      console.log("Sorted Posts Order:", fetchedPosts.map(post => ({
        id: post.id,
        categories: post.categories,
        createdAt: post.createdAt?.toDate ? post.createdAt.toDate().toISOString() : post.createdAt,
      })));
      setPosts(fetchedPosts);
    });

    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        const preferencesDoc = await getDoc(doc(db, 'userPreferences', user.uid));
        if (preferencesDoc.exists()) {
          const prefs = preferencesDoc.data();
          console.log("Fetched Preferences from Firestore:", prefs);
          setUserPreferences(prefs.travelCategories || []);
        } else {
          console.log("No preferences document found for user:", user.uid);
          setUserPreferences([]);
        }
      }
    };
    fetchUserPreferences();

    return () => unsubscribe();
  }, [userPreferences]);

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
        exif: true,
        videoMaxDuration: 30,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        console.log('Picked media:', {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
          duration: asset.duration,
          fileSize: asset.fileSize,
        });

        const maxSize = 10 * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > maxSize) {
          alert('File size exceeds 10 MB. Please select a smaller file.');
          return;
        }

        if (asset.mimeType?.startsWith('video') && asset.duration > 30000) {
          alert('Video exceeds 30 seconds. Please select a shorter video.');
          return;
        }

        const extension = getFileExtension(asset.uri, asset.mimeType);
        if (asset.mimeType?.startsWith('video') && Platform.OS === 'web' && extension !== 'mp4') {
          alert('On web, only MP4 videos are supported. Please convert the video to MP4.');
          return;
        }

        setMediaUri(asset.uri);
        setMediaType(asset.mimeType?.startsWith('video') ? 'video' : 'image');
      } else {
        console.log('User cancelled media picker');
      }
    } catch (error) {
      console.error('Error picking media:', error.message, 'Stack:', error.stack);
      alert('Failed to pick media. Please try again.');
    }
  };

  const getFileExtension = (uri, mimeType) => {
    if (mimeType) {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg';
      if (mimeType.includes('png')) return 'png';
      if (mimeType.includes('mp4')) return 'mp4';
      if (mimeType.includes('quicktime') || mimeType.includes('mov')) return 'mov';
    }
    const uriParts = uri.split('.');
    if (uriParts.length > 1) {
      const ext = uriParts.pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'mp4', 'mov'].includes(ext)) return ext;
    }
    console.warn('Unknown extension, defaulting to jpeg for images, mp4 for videos');
    return mimeType && mimeType.startsWith('video') ? 'mp4' : 'jpeg';
  };

  const uploadMediaToStorage = async (uri, userId, mimeType) => {
    try {
      console.log('Starting media upload for URI:', uri, 'User ID:', userId, 'MimeType:', mimeType);
      const extension = getFileExtension(uri, mimeType);
      console.log('Determined file extension:', extension);
      if (!['jpg', 'jpeg', 'png', 'mp4'].includes(extension)) {
        console.log('Unsupported file format:', extension);
        alert('Only JPEG, PNG, and MP4 files are supported');
        throw new Error('Unsupported file format');
      }

      const contentType = mimeType || (extension === 'png' ? 'image/png' : extension === 'jpeg' || extension === 'jpg' ? 'image/jpeg' : 'video/mp4');
      const fileName = `posts/${userId}/${Date.now()}.${extension}`;
      console.log('File name:', fileName, 'Content type:', contentType);

      let uploadUri = uri;
      if (['jpg', 'jpeg', 'png'].includes(extension)) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: extension === 'png' ? 'png' : 'jpeg' },
        );
        console.log('Compressed image URI:', manipulatedImage.uri, 'Size:', manipulatedImage.width, 'x', manipulatedImage.height);
        uploadUri = manipulatedImage.uri;
      } else {
        console.log('Skipping compression for video');
      }

      const response = await fetch(uploadUri);
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);

      if (blob.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10 MB after processing. Please select a smaller file.');
        throw new Error('File size exceeds 10 MB');
      }

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
      console.log('Media uploaded successfully to:', fileName);
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
      console.error('Error in uploadMediaToStorage:', error.message, 'Stack:', error.stack);
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

      if (mediaUri) {
        console.log('Uploading media for post, type:', mediaType);
        downloadURL = await uploadMediaToStorage(mediaUri, user.uid, mediaType === 'video' ? 'video/mp4' : null);
        console.log('Media uploaded, downloadURL:', downloadURL);
      } else {
        console.log('No media to upload');
      }

      console.log('Preparing Firestore data:', {
        text: postText,
        mediaUri: downloadURL || null,
        mediaType: mediaType || null,
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
          mediaUri: downloadURL || null,
          mediaType: mediaType || null,
          username,
          categories: selectedCategories,
        });
        console.log('Post updated successfully');
        setEditingPost(null);
      } else {
        console.log('Creating new post');
        const docRef = await addDoc(collection(db, 'posts'), {
          text: postText,
          mediaUri: downloadURL || null,
          mediaType: mediaType || null,
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
      setMediaUri(null);
      setMediaType(null);
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
    setMediaUri(post.mediaUri || post.imageUri);
    setMediaType(post.mediaType || (post.imageUri ? 'image' : null));
    setSelectedCategories(post.categories || []);
    setModalVisible(true);
  };

  const handleDeletePost = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const post = postSnap.data();
        const uri = post.mediaUri || post.imageUri;
        if (uri) {
          const filePath = uri.split('/posts/')[1];
          await supabase.storage.from('posts').remove([filePath]);
        }
        await deleteDoc(postRef);
      }
    } catch (error) {
      console.error('Error deleting post: ', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const categories = ['Solo', 'Couple', 'Family', 'Nature', 'Wildlife', 'Mountains', 'Beaches', 'Adventure', 'Culture', 'Temples'];
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
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
                  source={{ uri: item.profilePicture || 'https://picsum.photos/40/40' }}
                  style={styles.profilePicture}
                  onError={(e) => {
                    console.log('Profile picture load error:', item.profilePicture, e.nativeEvent.error);
                  }}
                />
                <View>
                  <Text style={styles.username}>{item.username || 'User'}</Text>
                  <Text style={styles.postTime}>{formatTimeSince(item.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.postText}>{item.text}</Text>
              {(item.mediaUri || item.imageUri) && (
                (item.mediaType === 'video' || (!item.mediaType && !item.imageUri)) ? (
                  <Video
                    source={{ uri: item.mediaUri || item.imageUri }}
                    style={styles.postImage}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                    onLoad={(status) => {
                      console.log('Video load status:', status);
                      if (status.naturalSize) {
                        console.log('Video loaded:', {
                          width: status.naturalSize.width,
                          height: status.naturalSize.height,
                          aspectRatio: status.naturalSize.width / status.naturalSize.height,
                        });
                      } else {
                        console.warn('Natural size unavailable, using default aspect ratio');
                      }
                    }}
                    onError={(e) => console.log('Video playback error:', item.mediaUri || item.imageUri, e)}
                  />
                ) : (
                  <Image
                    source={{ uri: item.mediaUri || item.imageUri }}
                    style={styles.postImage}
                    resizeMode="contain"
                    onError={(e) => console.log('Image load error:', item.mediaUri || item.imageUri, e.nativeEvent.error)}
                    onLoad={() => console.log('Image loaded successfully:', item.mediaUri || item.imageUri)}
                  />
                )
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
            <TouchableOpacity style={styles.imagePickerIcon} onPress={pickMedia}>
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
            {mediaUri && (
              mediaType === 'video' ? (
                <Video
                  source={{ uri: mediaUri }}
                  style={styles.imagePreview}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                  onLoad={(status) => {
                    console.log('Video preview load status:', status);
                    if (status.naturalSize) {
                      console.log('Video preview loaded:', {
                        width: status.naturalSize.width,
                        height: status.naturalSize.height,
                        aspectRatio: status.naturalSize.width / status.naturalSize.height,
                      });
                    } else {
                      console.warn('Natural size unavailable for preview, using default aspect ratio');
                    }
                  }}
                  onError={(e) => console.log('Video preview error:', mediaUri, e)}
                />
              ) : (
                <Image
                  source={{ uri: mediaUri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                  onError={(e) => console.log('Image preview error:', mediaUri, e.nativeEvent.error)}
                />
              )
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
                  setMediaUri(null);
                  setMediaType(null);
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
                <Text style={styles.addPostButton}>{editingPost ? 'Update' : 'Add Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PostFeed;