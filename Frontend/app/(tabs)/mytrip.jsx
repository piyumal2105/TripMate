import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Colors } from "./../../constants/Colors";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import StartNewTripCard from "./../../components/MyTrips/StartNewTripcard";

export default function MyTrip() {
  const [userTrips, setUserTrips] = useState([]);
  const router = useRouter();

  return (
    <View
      style={{
        padding: 25,
        paddingTop: 55,
        backgroundColor: Colors.WHITE,
        height: "100%",
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontFamily: "outfit-bold",
            fontSize: 35,
          }}
        >
          My Trips
        </Text>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => router.replace("UserProfileScreen/UserProfileScreen")}
        >
          <Ionicons name="person-circle-outline" size={50} color="black" />
        </TouchableOpacity>
      </View>

      {userTrips?.length === 0 ? <StartNewTripCard /> : null}
    </View>
  );
}
