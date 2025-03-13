import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Colors } from "../constants/Colors.js";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../../firebase.js";
import NetInfo from "@react-native-community/netinfo";

export default function SignIn({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Check for internet connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // For React Native 0.63 and above:
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected);

        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener((state) => {
          setIsConnected(state.isConnected);
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error("Error checking network:", error);
        // If NetInfo fails, assume connection is available
        setIsConnected(true);
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          // Add a small delay to ensure navigation works properly
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "HomePage" }],
            });
          }, 100);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again."
      );
      return;
    }

    setLoading(true);

    try {
      // Try sign in with retry logic
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;

          // Store the token
          await AsyncStorage.setItem("authToken", user.uid);

          // Sign in successful
          Alert.alert("Success", "Logged in successfully!", [
            {
              text: "OK",
              onPress: () => {
                // Use navigation.reset to clear the navigation stack
                navigation.reset({
                  index: 0,
                  routes: [{ name: "HomePage" }],
                });
              },
            },
          ]);
          return; // Exit the function if successful
        } catch (error) {
          if (
            error.code === "auth/network-request-failed" &&
            attempts < maxAttempts - 1
          ) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1500));
            attempts++;
            continue;
          }
          throw error; // Re-throw if it's not a network error or we've hit max attempts
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);

      // Provide a more user-friendly error message
      let errorMessage =
        "Failed to sign in. Please check your credentials and try again.";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      }

      Alert.alert("Sign In Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Landing")}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      {!isConnected && (
        <View style={styles.networkWarning}>
          <Text style={styles.networkWarningText}>
            No internet connection. Please connect to continue.
          </Text>
        </View>
      )}

      <Text style={styles.title}>Let's Sign You In</Text>
      <Text style={styles.subtitle}>Welcome Back</Text>
      <Text style={styles.subtitle}>You've been missed!</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />
      </View>

      <TouchableOpacity
        onPress={handleSignIn}
        style={[
          styles.button,
          loading && { opacity: 0.7 },
          !isConnected && { backgroundColor: Colors.GRAY },
        ]}
        disabled={loading || !isConnected}
      >
        {loading ? (
          <ActivityIndicator color={Colors.WHITE} />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("SignUp")}
        style={styles.createAccountButton}
      >
        <Text style={styles.createAccountText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingTop: 40,
    backgroundColor: Colors.WHITE,
    height: "100%",
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 30,
    marginTop: 30,
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 30,
    color: Colors.GRAY,
    marginTop: 10,
  },
  inputContainer: {
    marginTop: 20,
  },
  label: {
    fontFamily: "outfit",
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 15,
    fontFamily: "outfit",
  },
  button: {
    padding: 20,
    backgroundColor: "#0478A7",
    borderRadius: 15,
    marginTop: 50,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },
  createAccountButton: {
    padding: 20,
    backgroundColor: Colors.WHITE,
    borderRadius: 15,
    marginTop: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  createAccountText: {
    color: Colors.PRIMARY,
    fontFamily: "outfit-bold",
  },
  networkWarning: {
    backgroundColor: "#FFE4E1",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  networkWarningText: {
    color: "#FF0000",
    fontFamily: "outfit",
    textAlign: "center",
  },
});
