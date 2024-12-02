import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import HomePage from "./HomePage.jsx";
import SocialMedia from "./SocialMedia.jsx";
import Map from "./Map.jsx";
import Emergency from "./Emergency.jsx";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Social") iconName = "logo-instagram";
          else if (route.name === "Map") iconName = "map-outline";
          else if (route.name === "Emergency")
            iconName = "alert-circle-outline";
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#0478A7",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { backgroundColor: "#fafcfb" },
      })}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Social" component={SocialMedia} />
      <Tab.Screen name="Map" component={Map} />
      <Tab.Screen name="Emergency" component={Emergency} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
