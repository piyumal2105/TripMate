import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const travelPreferences = ["Solo", "Group", "Family"];

const TravelPreferenceScreen = () => {
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const router = useRouter();

  const toggleSelection = (preference) => {
    setSelectedPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Select Your Travel Preferences</Text>

      {/* Tags for Preferences */}
      <ScrollView
        contentContainerStyle={styles.tagsContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {travelPreferences.map((preference) => (
          <TouchableOpacity
            key={preference}
            style={[
              styles.tag,
              selectedPreferences.includes(preference) && styles.selectedTag,
            ]}
            onPress={() => toggleSelection(preference)}
          >
            <Text
              style={[
                styles.tagText,
                selectedPreferences.includes(preference) &&
                  styles.selectedTagText,
              ]}
            >
              {preference}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() =>
          router.push({
            pathname: "TravelPreferenceScreens/TravelCategoriesScreen",
            params: {
              travelPreferences: selectedPreferences,
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
    marginHorizontal: 5,
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

export default TravelPreferenceScreen;
