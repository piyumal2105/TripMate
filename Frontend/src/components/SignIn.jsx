// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
// } from "react-native";
// import React, { useEffect } from "react";
// import { useNavigation, useRouter } from "expo-router";
// import { Colors } from "../constants/Colors.js";
// import { useRouteNode } from "expo-router/build/Route";
// import Ionicons from "@expo/vector-icons/Ionicons";

// export default function SignIn({ navigation }) {
//   return (
//     <View
//       style={{
//         padding: 25,
//         paddingTop: 40,
//         backgroundColor: Colors.WHITE,
//         height: "100%",
//       }}
//     >
//       <TouchableOpacity onPress={() => navigation.navigate("Landing")}>
//         <Ionicons name="arrow-back" size={24} color="black" />
//       </TouchableOpacity>
//       <Text
//         style={{
//           fontFamily: "outfit-bold",
//           fontSize: 30,
//           marginTop: 30,
//         }}
//       >
//         Let's Sign You In
//       </Text>

//       <Text
//         style={{
//           fontFamily: "outfit",
//           fontSize: 30,
//           color: Colors.Gray,
//           marginTop: 20,
//         }}
//       >
//         Welcome Back
//       </Text>

//       <Text
//         style={{
//           fontFamily: "outfit",
//           fontSize: 30,
//           color: Colors.Gray,
//           marginTop: 10,
//         }}
//       >
//         You've been missed!
//       </Text>

//       <View
//         style={{
//           marginTop: 50,
//         }}
//       >
//         <Text
//           style={{
//             fontFamily: "outfit",
//           }}
//         >
//           Email
//         </Text>
//         <TextInput style={styles.input} placeholder="Enter Email" />
//       </View>
//       <View
//         style={{
//           marginTop: 20,
//         }}
//       >
//         <Text
//           style={{
//             fontFamily: "outfit",
//           }}
//         >
//           Password
//         </Text>
//         <TextInput
//           secureTextEntry={true}
//           style={styles.input}
//           placeholder="Enter Password"
//         />
//       </View>

//       {/* Sign in button */}
//       <View
//         style={{
//           padding: 20,
//           backgroundColor: Colors.PRIMARY,
//           borderRadius: 15,
//           marginTop: 50,
//         }}
//       >
//         <Text
//           style={{
//             color: Colors.WHITE,
//             textAlign: "center",
//           }}
//         >
//           Sign In
//         </Text>
//       </View>

//       <TouchableOpacity
//         onPress={() => navigation.navigate("SignUp")}
//         style={{
//           padding: 20,
//           backgroundColor: Colors.WHITE,
//           borderRadius: 15,
//           marginTop: 20,
//           borderWidth: 1,
//         }}
//       >
//         <Text
//           style={{
//             color: Colors.PRIMARY,
//             textAlign: "center",
//           }}
//         >
//           Create Account
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   input: {
//     padding: 15,
//     borderWidth: 1,
//     borderColor: Colors.GRAY,
//     borderRadius: 15,
//     fontFamily: "outfit",
//   },
// });

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { Colors } from "../constants/Colors.js";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SignIn({ navigation }) {
  // State variables to handle form input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to handle user login
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      // Make a POST request to the backend API
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Logged in successfully!");
        // Navigate to the next screen or home screen
        navigation.navigate("Home");
      } else {
        // Display error message from the backend
        Alert.alert("Error", result.error || "Login failed");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error(error);
    }
  };

  return (
    <View
      style={{
        padding: 25,
        paddingTop: 40,
        backgroundColor: Colors.WHITE,
        height: "100%",
      }}
    >
      <TouchableOpacity onPress={() => navigation.navigate("Landing")}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text
        style={{
          fontFamily: "outfit-bold",
          fontSize: 30,
          marginTop: 30,
        }}
      >
        Let's Sign You In
      </Text>

      <Text
        style={{
          fontFamily: "outfit",
          fontSize: 30,
          color: Colors.GRAY,
          marginTop: 20,
        }}
      >
        Welcome Back
      </Text>

      <Text
        style={{
          fontFamily: "outfit",
          fontSize: 30,
          color: Colors.GRAY,
          marginTop: 10,
        }}
      >
        You've been missed!
      </Text>

      {/* Email Input */}
      <View
        style={{
          marginTop: 50,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit",
          }}
        >
          Email
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View
        style={{
          marginTop: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit",
          }}
        >
          Password
        </Text>
        <TextInput
          secureTextEntry={true}
          style={styles.input}
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleSignIn}
        style={{
          padding: 20,
          backgroundColor: Colors.PRIMARY,
          borderRadius: 15,
          marginTop: 50,
        }}
      >
        <Text
          style={{
            color: Colors.WHITE,
            textAlign: "center",
          }}
        >
          Sign In
        </Text>
      </TouchableOpacity>

      {/* Create Account Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("SignUp")}
        style={{
          padding: 20,
          backgroundColor: Colors.WHITE,
          borderRadius: 15,
          marginTop: 20,
          borderWidth: 1,
        }}
      >
        <Text
          style={{
            color: Colors.PRIMARY,
            textAlign: "center",
          }}
        >
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 15,
    fontFamily: "outfit",
  },
});
