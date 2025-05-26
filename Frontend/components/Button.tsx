import { StyleSheet, View, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void; // Accept the onPress prop
};

export default function Button({ label, onPress }: Props) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable style={styles.button} onPress={onPress}> {/* Use the passed onPress function */}
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 15,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
