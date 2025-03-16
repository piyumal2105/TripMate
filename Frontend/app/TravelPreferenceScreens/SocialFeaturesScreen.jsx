import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const socialFeatures = ["Photos", "Reels", "Blogs"];

const SocialFeaturesScreen = () => {
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const router = useRouter();
  const params = useLocalSearchParams();

  const toggleSelection = (feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Select Social Features</Text>

      <View style={styles.optionsContainer}>
        {socialFeatures.map((feature) => (
          <TouchableOpacity
            key={feature}
            style={[
              styles.optionButton,
              selectedFeatures.includes(feature) && styles.selectedButton,
            ]}
            onPress={() => toggleSelection(feature)}
          >
            <Text
              style={[
                styles.optionText,
                selectedFeatures.includes(feature) && styles.selectedText,
              ]}
            >
              {feature}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() =>
          router.push({
            pathname: "TravelPreferenceScreens/SummaryScreen",
            params: {
              ...params,
              selectedFeatures,
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
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
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
    marginTop: 40,
    marginBottom: 50,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 30,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    margin: 5,
    backgroundColor: "#fff",
    borderColor: "#0478A7",
  },
  selectedButton: {
    backgroundColor: "#0478A7",
    borderColor: "#0478A7",
  },
  optionText: {
    fontSize: 16,
    color: "#0478A7",
    textAlign: "center",
  },
  selectedText: {
    color: "#fff",
  },
  nextButton: {
    backgroundColor: "#0478A7",
    paddingVertical: 15,
    borderRadius: 8,
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

export default SocialFeaturesScreen;
