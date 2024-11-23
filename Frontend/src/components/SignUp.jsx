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
import { useNavigation } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const API_URL = "http://127.0.0.1:8000/signup";

export default function SignUp({ navigation }) {
  // State variables to handle form input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // For loading state

  // Function to handle sign-up request
  const handleSignUp = async () => {
    // Basic validation
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // Firebase Authentication - Sign up with email and password
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // After Firebase user is created, send request to FastAPI backend to store full name
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`, // Send Firebase ID token for authentication
        },
        body: JSON.stringify({
          uid: user.uid, // Firebase user ID
          full_name: fullName, // Match the backend expected fields
          email: email,
        }),
      });

      const result = await response.json(); // Parse the JSON response

      if (response.ok) {
        // If sign-up is successful, navigate to Sign-In screen
        Alert.alert("Success", "Account created successfully!");
        navigation.navigate("SignIn");
      } else {
        // If an error occurs, display the error message
        Alert.alert("Error", result.detail || "Sign-up failed");
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      Alert.alert("Error", error.message || "Failed to sign up. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        padding: 25,
        paddingTop: 50,
        backgroundColor: Colors.WHITE,
        height: "100%",
      }}
    >
      <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text
        style={{
          fontFamily: "outfit-bold",
          fontSize: 30,
          marginTop: 30,
        }}
      >
        Create New Account
      </Text>

      {/* Full Name Input */}
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
          Full Name
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Full Name"
          value={fullName}
          onChangeText={setFullName} // Update full name state
        />
      </View>

      {/* Email Input */}
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
          Email
        </Text>
        <TextInput
          keyboardType="email-address"
          style={styles.input}
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail} // Update email state
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
          onChangeText={setPassword} // Update password state
        />
      </View>

      {/* Create Account Button */}
      <TouchableOpacity
        onPress={handleSignUp}
        style={{
          padding: 20,
          backgroundColor: Colors.PRIMARY,
          borderRadius: 15,
          marginTop: 50,
          opacity: loading ? 0.7 : 1, // Disable button during loading
        }}
        disabled={loading} // Disable button during loading
      >
        <Text
          style={{
            color: Colors.WHITE,
            textAlign: "center",
            fontFamily: "outfit-bold",
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Text>
      </TouchableOpacity>

      {/* Sign In Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("SignIn")}
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
          Sign In
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
