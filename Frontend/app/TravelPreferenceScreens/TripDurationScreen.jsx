import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const tripDurations = ["Weekdays", "Weekend", "Holidays"];

const TripDurationScreen = () => {
  const [selectedDurations, setSelectedDurations] = useState([]);
  const router = useRouter();
  const params = useLocalSearchParams();

  const toggleSelection = (duration) => {
    setSelectedDurations((prev) =>
      prev.includes(duration)
        ? prev.filter((d) => d !== duration)
        : [...prev, duration]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Preferred Trip Duration</Text>
      <View style={styles.tagsContainer}>
        {tripDurations.map((duration) => (
          <TouchableOpacity
            key={duration}
            style={[
              styles.tag,
              selectedDurations.includes(duration) && styles.selectedTag,
            ]}
            onPress={() => toggleSelection(duration)}
          >
            <Text
              style={[
                styles.tagText,
                selectedDurations.includes(duration) && styles.selectedTagText,
              ]}
            >
              {duration}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() =>
          router.push({
            pathname: "TravelPreferenceScreens/SocialFeaturesScreen",
            params: { ...params, tripDurations: selectedDurations },
          })
        }
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  backButton: { position: "absolute", top: 40, left: 20, zIndex: 1000 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 40,
    marginBottom: 50,
    textAlign: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 30,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    margin: 5,
    backgroundColor: "#fff",
    borderColor: "#0478A7",
  },
  selectedTag: {
    backgroundColor: "#0478A7",
    borderColor: "#0478A7",
  },
  tagText: {
    fontSize: 16,
    color: "#0478A7",
  },
  selectedTagText: {
    color: "#fff",
  },
  nextButton: {
    backgroundColor: "#0478A7",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 450,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default TripDurationScreen;
