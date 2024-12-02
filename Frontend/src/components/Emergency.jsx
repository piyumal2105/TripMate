import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const EmergencyPage = () => {
  const trips = [
    { id: "1", title: "Gall Trip", date: "05/12/24" },
    { id: "2", title: "Kandy Trip", date: "10/12/24" },
    { id: "3", title: "Colombo Business Trip", date: "12/12/24" },
    { id: "4", title: "Nuwara Eliya Getaway", date: "18/12/24" },
    { id: "5", title: "Sigiriya Adventure", date: "22/12/24" },
  ];

  const renderTrip = ({ item }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripInfo}>
        <Text style={styles.tripTitle}>{item.title}</Text>
        <Text style={styles.tripDate}>{item.date}</Text>
      </View>
      <TouchableOpacity style={styles.startButton}>
        <Text style={styles.startButtonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Trip List */}
      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tripList}
      />

      {/* Floating Create New Trip Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fafcfb",
    padding: 15,
  },
  tripList: {
    marginBottom: 20,
  },
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3578a8",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  tripDate: {
    fontSize: 14,
    color: "#fff",
  },
  startButton: {
    backgroundColor: "#a1f0d9",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  startButtonText: {
    fontSize: 14,
    color: "black",
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3578a8",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default EmergencyPage;
