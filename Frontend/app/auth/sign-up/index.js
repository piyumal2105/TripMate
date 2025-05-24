import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "./../../../constants/Colors";
import { useNavigation, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "./../../../configs/FirebaseConfig"; // Ensure db is imported
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();

  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [fullName, setFullName] = useState(); // Fixed typo: setFulName → setFullName

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const OnCreateAccount = async () => {
    if (!email || !password || !fullName) {
      ToastAndroid.show("Please fill all fields", ToastAndroid.LONG);
      return;
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User created:", user);

      // Update Firebase Auth profile with displayName
      await updateProfile(user, {
        displayName: fullName,
      });
      console.log("Display name updated successfully in Firebase Auth");

      // Save fullName to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        email: email,
        uid: user.uid,
        createdAt: new Date(),
      });
      console.log("User data saved to Firestore");

      // Navigate to next screen
      router.replace("TravelPreferenceScreens/TravelPreferenceScreen");
    } catch (error) {
      console.error("Signup error:", error);
      ToastAndroid.show(
        "Error signing up. Please try again.",
        ToastAndroid.LONG
      );
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
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={{ fontSize: 35, marginTop: 30 }}>Create New Account</Text>

      <View style={{ marginTop: 50 }}>
        <Text>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Full Name"
          onChangeText={(value) => setFullName(value)} // Fixed typo
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={(value) => setEmail(value)}
          placeholder="Enter Email"
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text>Password</Text>
        <TextInput
          secureTextEntry={true}
          style={styles.input}
          onChangeText={(value) => setPassword(value)}
          placeholder="Enter Password"
        />
      </View>

      <TouchableOpacity
        onPress={OnCreateAccount}
        style={{
          padding: 20,
          backgroundColor: "#0478A7",
          borderRadius: 15,
          marginTop: 50,
        }}
      >
        <Text style={{ color: Colors.WHITE, textAlign: "center" }}>
          Create Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("auth/sign-in")}
        style={{
          padding: 20,
          backgroundColor: Colors.WHITE,
          borderRadius: 15,
          marginTop: 20,
          borderWidth: 1,
        }}
      >
        <Text style={{ color: Colors.PRIMARY, textAlign: "center" }}>
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
  },
});
