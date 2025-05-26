import { Text, View, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width; 
const screenHeight = Dimensions.get('window').height; 

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('@/assets/images/BGimage.jpeg')} 
        style={styles.image}
        resizeMode="cover"
      />

      {/* Overlay Container for Button */}
      <View style={styles.overlay}>
        <TouchableOpacity onPress={() => router.push('/home')} style={styles.buttonContainer}>
          <LinearGradient
            colors={['#8E2DE2', '#4A00E0']} // Gradient purple colors
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  image: {
    width: screenWidth, 
    height: screenHeight, 
    position: 'absolute',
  },
  overlay: {
    position: 'absolute', 
    top: '80%', 
    left: 0,
    right: 0,
    transform: [{ translateY: -40 }], 
    alignItems: 'center',
  },
  buttonContainer: {
    width: 200,
    borderRadius: 25,
    overflow: 'hidden', // Ensures the gradient doesn't overflow
  },
  gradientButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
