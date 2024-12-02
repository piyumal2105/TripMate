import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const navigation = useNavigation();

  const toggleMenu = (menuIndex) => {
    setExpandedMenu(expandedMenu === menuIndex ? null : menuIndex);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogout = () => {
    navigation.navigate("SignIn");
  };

  return (
    <ScrollView style={styles.screen}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Profile Info Section */}
      <View style={styles.profileInfo}>
        <Image
          source={{
            uri: "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>johndoe@gmail.com</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>360</Text>
          <Text style={styles.statLabel}>Reward Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>238</Text>
          <Text style={styles.statLabel}>Travel Trips</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>473</Text>
          <Text style={styles.statLabel}>Bucket List</Text>
        </View>
      </View>

      {/* Menu Section */}
      <View style={styles.menu}>
        {/* Profile Section */}
        <TouchableOpacity style={styles.menuItem} onPress={() => toggleMenu(0)}>
          <Icon name="person" size={24} color="#555" />
          <Text style={styles.menuText}>Profile</Text>
          <Icon
            name={expandedMenu === 0 ? "expand-less" : "expand-more"}
            size={24}
            color="#999"
          />
        </TouchableOpacity>
        {expandedMenu === 0 && (
          <View style={styles.menuContent}>
            <Text style={styles.menuContentText}>
              View and edit your profile.
            </Text>
          </View>
        )}

        {/* Bookmarked Section */}
        <TouchableOpacity style={styles.menuItem} onPress={() => toggleMenu(1)}>
          <Icon name="bookmark" size={24} color="#555" />
          <Text style={styles.menuText}>Bookmarked</Text>
          <Icon
            name={expandedMenu === 1 ? "expand-less" : "expand-more"}
            size={24}
            color="#999"
          />
        </TouchableOpacity>
        {expandedMenu === 1 && (
          <View style={styles.menuContent}>
            <Text style={styles.menuContentText}>
              See your bookmarked places.
            </Text>
          </View>
        )}

        {/* Previous Trips Section */}
        <TouchableOpacity style={styles.menuItem} onPress={() => toggleMenu(2)}>
          <Icon name="flight" size={24} color="#555" />
          <Text style={styles.menuText}>Previous Trips</Text>
          <Icon
            name={expandedMenu === 2 ? "expand-less" : "expand-more"}
            size={24}
            color="#999"
          />
        </TouchableOpacity>
        {expandedMenu === 2 && (
          <View style={styles.menuContent}>
            <Text style={styles.menuContentText}>View your past trips.</Text>
          </View>
        )}

        {/* Settings Section */}
        <TouchableOpacity style={styles.menuItem} onPress={() => toggleMenu(3)}>
          <Icon name="settings" size={24} color="#555" />
          <Text style={styles.menuText}>Settings</Text>
          <Icon
            name={expandedMenu === 3 ? "expand-less" : "expand-more"}
            size={24}
            color="#999"
          />
        </TouchableOpacity>
        {expandedMenu === 3 && (
          <View style={styles.menuContent}>
            <Text style={styles.menuContentText}>
              Adjust your account settings.
            </Text>
          </View>
        )}

        {/* Version Section */}
        <TouchableOpacity style={styles.menuItem} onPress={() => toggleMenu(4)}>
          <Icon name="info" size={24} color="#555" />
          <Text style={styles.menuText}>Version</Text>
          <Icon
            name={expandedMenu === 4 ? "expand-less" : "expand-more"}
            size={24}
            color="#999"
          />
        </TouchableOpacity>
        {expandedMenu === 4 && (
          <View style={styles.menuContent}>
            <Text style={styles.menuContentText}>App version: 1.0.0</Text>
          </View>
        )}
      </View>
      {/* Logout Section */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fafcfb",
  },
  header: {
    paddingTop: 40,
    paddingLeft: 15,
  },
  backButton: {
    padding: 10,
  },
  profileInfo: {
    marginTop: 20,
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0478A7",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  menu: {
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    flex: 1,
  },
  menuContent: {
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  menuContentText: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#d32f2f",
    borderRadius: 10,
    marginTop: 10,
    margin: 15,
  },
  logoutText: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 10,
  },
});

export default ProfileScreen;
