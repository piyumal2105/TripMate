import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import user from "../assets/user.png";
import notification from "../assets/notification.png";
import sigiriya from "../assets/sigiriya.webp";
import rocktrip from "../assets/rocktrip.jpg";

const HomePage = () => {
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const notifications = [
    {
      id: "1",
      message: "Your trip to Sigiriya is confirmed!",
      type: "success",
      timestamp: "2024-12-01 10:00 AM",
      read: false,
      link: null,
    },
    {
      id: "2",
      message: "New destinations added to your favorites.",
      type: "info",
      timestamp: "2024-11-30 05:30 PM",
      read: true,
      link: null,
    },
    {
      id: "3",
      message: "Limited-time offers on Darma Hills!",
      type: "promo",
      timestamp: "2024-11-29 03:15 PM",
      read: false,
      link: "https://www.example.com/offers/darma-hills",
    },
    {
      id: "4",
      message: "Check out the best places to visit this summer!",
      type: "info",
      timestamp: "2024-11-28 08:20 AM",
      read: true,
      link: "https://www.example.com/summer-destinations",
    },
  ];

  const handleNavigate = () => {
    navigation.navigate("ProfileScreen");
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  const renderNotification = ({ item }) => (
    <View style={[styles.notificationCard, styles[item.type]]}>
      <Text style={styles.notificationText}>{item.message}</Text>
      <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
      {item.link && (
        <TouchableOpacity onPress={() => handleLinkPress(item.link)}>
          <Text style={styles.notificationLink}>Learn More</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={handleNavigate}>
            <Image source={user} style={styles.avatar} />
          </TouchableOpacity>
          <Text style={styles.userName}>John Doe</Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon} onPress={toggleModal}>
          <Image source={notification} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Heading */}
      <View style={styles.headingContainer}>
        <Text style={styles.heading}>
          Explore the{" "}
          <Text style={styles.highlightedText}>Beautiful world!</Text>
        </Text>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best Destination</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {/* Destination Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardContainer}
      >
        <View style={styles.card}>
          <Image source={sigiriya} style={styles.cardImage} />
          <Text style={styles.cardTitle}>Niladri Reservoir</Text>
          <Text style={styles.cardSubtitle}>Tekergat, Sunamgnj</Text>
        </View>
        <View style={styles.card}>
          <Image source={rocktrip} style={styles.cardImage} />
          <Text style={styles.cardTitle}>Darma Hills</Text>
          <Text style={styles.cardSubtitle}>Darma Valley</Text>
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotification}
              contentContainerStyle={styles.notificationList}
            />
            <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fafcfb",
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  notificationIcon: {
    padding: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  headingContainer: {
    marginTop: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  highlightedText: {
    color: "#ff7f50",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  viewAll: {
    fontSize: 14,
    color: "#0478A7",
  },
  cardContainer: {
    marginTop: 30,
    flexDirection: "row",
  },
  card: {
    width: 150,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 100,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    margin: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  notificationList: {
    width: "150%",
  },
  notificationCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  notificationText: {
    fontSize: 14,
    color: "#333",
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  notificationLink: {
    fontSize: 14,
    color: "#0478A7",
    marginTop: 5,
  },
  success: {
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  info: {
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  promo: {
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#0478A7",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default HomePage;
