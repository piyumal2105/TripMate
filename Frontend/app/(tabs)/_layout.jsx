import { View, Text } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
// import { Colors } from "./../../constants/Colors";

const Colors = {
  PRIMARY: "#0478A7",
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
            <Ionicons name="location-sharp" size={24} color="#0478A7" />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarLabel: "Social",
          tabBarIcon: ({ color }) => (
            <Ionicons name="globe" size={24} color="#0478A7" />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          tabBarLabel: "Groups",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={24} color="#0478A7" />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          tabBarLabel: "Maps",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={24} color="#0478A7" />
          ),
        }}
      />
      <Tabs.Screen
        name="replan"
        options={{
          tabBarLabel: "RePlan",
          tabBarIcon: ({ color }) => (
            <Ionicons name="repeat" size={24} color="#0478A7" />
          ),
        }}
      />
    </Tabs>
  );
}
