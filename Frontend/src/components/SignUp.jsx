// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
// } from "react-native";
// import React, { useState } from "react";
// import { Colors } from "../constants/Colors.js";
// import Ionicons from "@expo/vector-icons/Ionicons";

// export default function SignUp({ navigation }) {
//   // State variables to handle form input
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   // Basic validation function
//   const handleSignUp = () => {
//     if (!fullName || !email || !password) {
//       Alert.alert("Error", "Please fill all fields");
//     } else {
//       Alert.alert("Success", "Account created successfully!");
//       navigation.navigate("SignIn");
//     }
//   };

//   return (
//     <View
//       style={{
//         padding: 25,
//         paddingTop: 50,
//         backgroundColor: Colors.WHITE,
//         height: "100%",
//       }}
//     >
//       <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
//         <Ionicons name="arrow-back" size={24} color="black" />
//       </TouchableOpacity>

//       <Text
//         style={{
//           fontFamily: "outfit-bold",
//           fontSize: 30,
//           marginTop: 30,
//         }}
//       >
//         Create New Account
//       </Text>

//       {/* Full Name Input */}
//       <View style={{ marginTop: 50 }}>
//         <Text style={{ fontFamily: "outfit" }}>Full Name</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Enter Full Name"
//           value={fullName}
//           onChangeText={setFullName}
//         />
//       </View>

//       {/* Email Input */}
//       <View style={{ marginTop: 20 }}>
//         <Text style={{ fontFamily: "outfit" }}>Email</Text>
//         <TextInput
//           keyboardType="email-address"
//           style={styles.input}
//           placeholder="Enter Email"
//           value={email}
//           onChangeText={setEmail}
//         />
//       </View>

//       {/* Password Input */}
//       <View style={{ marginTop: 20 }}>
//         <Text style={{ fontFamily: "outfit" }}>Password</Text>
//         <TextInput
//           secureTextEntry={true}
//           style={styles.input}
//           placeholder="Enter Password"
//           value={password}
//           onChangeText={setPassword}
//         />
//       </View>

//       {/* Create Account Button */}
//       <TouchableOpacity
//         onPress={handleSignUp}
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
//             fontFamily: "outfit-bold",
//           }}
//         >
//           Create Account
//         </Text>
//       </TouchableOpacity>

//       {/* Sign In Button */}
//       <TouchableOpacity
//         onPress={() => navigation.navigate("SignIn")}
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
//           Sign In
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

export default function SignUp({ navigation }) {
  // State variables to handle form input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to handle user registration
  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      // Make a POST request to the backend API
      const response = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Account created successfully!");
        navigation.navigate("SignIn"); // Navigate to the SignIn screen
      } else {
        // Display error message from the backend
        Alert.alert("Error", result.error || "Registration failed");
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
      <View style={{ marginTop: 50 }}>
        <Text style={{ fontFamily: "outfit" }}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      {/* Email Input */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontFamily: "outfit" }}>Email</Text>
        <TextInput
          keyboardType="email-address"
          style={styles.input}
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontFamily: "outfit" }}>Password</Text>
        <TextInput
          secureTextEntry={true}
          style={styles.input}
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
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
        }}
      >
        <Text
          style={{
            color: Colors.WHITE,
            textAlign: "center",
            fontFamily: "outfit-bold",
          }}
        >
          Create Account
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
