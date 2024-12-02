import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Button,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import defaultAvatar from "../assets/user.png";

const posts = [
  {
    id: "1",
    user: "John Doe",
    avatar: "https://www.tadpole.co.nz/wp-content/uploads/2021/02/team-1.jpg",
    content: "Exploring new adventures! 🌍✨",
    time: "1 hr ago",
    image:
      "https://media.istockphoto.com/id/1369171053/photo/group-of-sporty-people-walks-in-mountains-at-sunset-with-backpacks.jpg?s=612x612&w=0&k=20&c=ajQuWt2YRWd0FPaCpdKz2Tt3WX2NI1ddeZjf8HIxlwU=",
  },
  {
    id: "2",
    user: "Jane Smith",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMYR0TAT4xCZgg-7cvDs2gH02sMGHAIbFDYQ&s",
    content: "This sunset is breathtaking 🌅",
    time: "3 hrs ago",
    image:
      "https://images.unsplash.com/photo-1639056610940-d7e9b0af3a99?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmVhdXRpZnVsJTIwc3Vuc2V0fGVufDB8fDB8fHww",
  },
  {
    id: "3",
    user: "Emily Brown",
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    content: "Amazing day at the beach 🏖️.",
    time: "5 hrs ago",
    image:
      "https://www.shutterstock.com/image-photo/happy-family-children-playing-on-600nw-2472674293.jpg",
  },
  {
    id: "4",
    user: "Michael Johnson",
    avatar: "https://www.tadpole.co.nz/wp-content/uploads/2021/02/team-4.jpg",
    content: "First mountain hike of the year. 🗻",
    time: "8 hrs ago",
    image: "https://live.staticflickr.com/417/18575118970_bc443ffdc2_b.jpg",
  },
  {
    id: "5",
    user: "Sophia Green",
    avatar:
      "https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    content: "The city lights are mesmerizing tonight 🌃.",
    time: "1 day ago",
    image:
      "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&q=80&w=1080",
  },
];

const SocialMedia = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const navigation = useNavigation();

  const handleNavigate = () => {
    navigation.navigate("ProfileScreen");
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity>
          <Image
            source={{ uri: item.avatar }}
            defaultSource={defaultAvatar}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.postHeaderText}>
          <TouchableOpacity>
            <Text style={styles.userName}>{item.user}</Text>
          </TouchableOpacity>
          <Text style={styles.postTime}>{item.time}</Text>
        </View>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Post Image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      ) : (
        <Text style={styles.noImageText}>No Image Available</Text>
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="thumb-up-outline" size={20} color="gray" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="comment-outline" size={20} color="gray" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share-outline" size={20} color="gray" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const addPost = () => {
    if (newPostContent) {
      posts.push({
        id: (posts.length + 1).toString(),
        user: "Current User",
        avatar: defaultAvatar,
        content: newPostContent,
        time: "Just now",
        image: null,
      });
      setNewPostContent("");
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Create Post Section */}
      <View style={styles.createPost}>
        <TouchableOpacity onPress={handleNavigate}>
          <Image source={defaultAvatar} style={styles.avatar} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          onFocus={() => setModalVisible(true)}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Icon name="video" size={20} color="red" />
          <Text style={styles.quickActionText}>Live</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Icon name="image-outline" size={20} color="green" />
          <Text style={styles.quickActionText}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Icon name="account-group" size={20} color="blue" />
          <Text style={styles.quickActionText}>Group</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.feed}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal for New Post */}
      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Create Post</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="gray" />
              </TouchableOpacity>
            </View>

            {/* Post Input Area */}
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Image Upload Section (optional) */}
            <TouchableOpacity style={styles.uploadButton}>
              <Icon name="camera" size={20} color="#0478A7" />
              <Text style={styles.uploadText}>Upload Photo</Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button title="Post" onPress={addPost} color="#0478A7" />
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                color="gray"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fafcfb",
  },
  createPost: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
  },
  feed: {
    paddingHorizontal: 10,
  },
  postContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  postHeaderText: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  postTime: {
    fontSize: 12,
    color: "gray",
  },
  postContent: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  noImageText: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    textAlign: "center",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "gray",
  },
  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: "#0478A7",
    right: 16,
    bottom: 16,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    height: 100,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderColor: "#007bff",
    borderWidth: 1,
    borderRadius: 20,
    justifyContent: "center",
    backgroundColor: "#f0f8ff",
    marginBottom: 10,
  },
  uploadText: {
    marginLeft: 5,
    color: "#007bff",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default SocialMedia;
