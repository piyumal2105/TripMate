import { View, Text } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
// import { Colors } from "./../../constants/Colors";

const Colors = {
  PRIMARY: "#0478A7", // Change this to your primary color
};
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.PRIMARY,
      }}
    >
      <Tabs.Screen
        name="mytrip"
        options={{
          tabBarLabel: "My Trip",
          tabBarIcon: ({ color }) => (
            <Ionicons name="location-sharp" size={24} color="color" />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarLabel: "Social",
          tabBarIcon: ({ color }) => (
            <Ionicons name="globe" size={24} color="color" />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          tabBarLabel: "Maps",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={24} color="color" />
          ),
        }}
      />
      <Tabs.Screen
        name="replan"
        options={{
          tabBarLabel: "RePlan",
          tabBarIcon: ({ color }) => (
            <Ionicons name="repeat" size={24} color="color" />
          ),
        }}
      />
      
    </Tabs>
  );
}
