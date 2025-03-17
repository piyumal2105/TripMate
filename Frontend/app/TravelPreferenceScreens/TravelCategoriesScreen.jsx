import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const travelCategories = [
  "Beaches",
  "Colonial Towns",
  "Cultural/Heritage Sites",
  "Gardens",
  "Hill Stations",
  "Museums",
  "Natural Attractions",
  "Tea Plantations",
  "Temples",
  "Wildlife/National Parks",
  "Mountains",
  "Hiking",
  "Adventure Sports",
  
];

const TravelCategoriesScreen = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const router = useRouter();
  const params = useLocalSearchParams();

  const toggleSelection = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Preferred Travel Categories</Text>

      {/* Tag-style category selection */}
      <ScrollView contentContainerStyle={styles.tagsContainer}>
        {travelCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tag,
              selectedCategories.includes(category) && styles.selectedTag,
            ]}
            onPress={() => toggleSelection(category)}
          >
            <Text
              style={[
                styles.tagText,
                selectedCategories.includes(category) && styles.selectedTagText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() =>
          router.push({
            pathname: "TravelPreferenceScreens/TripDurationScreen",
            params: {
              ...params,
              travelCategories: selectedCategories,
            },
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
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1000,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    marginTop: 120,
    textAlign: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 30,
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0478A7",
    margin: 5,
    backgroundColor: "#fff",
  },
  selectedTag: {
    backgroundColor: "#0478A7",
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
    marginTop: 20,
    marginBottom: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default TravelCategoriesScreen;
