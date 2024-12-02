import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Map = () => {
  return (
    <View style={styles.screen}>
      <Text>Map</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafcfb",
  },
});

export default Map;
