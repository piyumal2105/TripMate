import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../configs/FirebaseConfig';

const HomeScreen = () => {
    const [trips, setTrips] = useState([]);

    // Fetch trips from Firestore
    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'UserTrips'));
                const tripList = querySnapshot.docs.map((doc) => ({
                    ...doc.data(),
                    docId: doc.id
                }));
                setTrips(tripList);
            } catch (error) {
                ToastAndroid.show('Error fetching trips', ToastAndroid.LONG);
                console.error(error);
            }
        };

        fetchTrips();
    }, []);

    const handleDelete = async (docId) => {
        try {
            await deleteDoc(doc(db, 'UserTrips', docId));
            setTrips(trips.filter((trip) => trip.docId !== docId));
            ToastAndroid.show('Trip deleted successfully', ToastAndroid.SHORT);
        } catch (error) {
            ToastAndroid.show('Error deleting trip', ToastAndroid.LONG);
            console.error(error);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.tripItem}>
            <View style={styles.tripInfo}>
                <Link href={`/tripdetails/${item.docId}`} style={styles.tripLink}>
                    <Text style={styles.tripLocation}>{item.tripPlan.mainLocation}</Text>
                    <Ionicons name="chevron-forward" size={20} color="black" />
                </Link>
            </View>
            {
                item.status === "end" &&
                <TouchableOpacity onPress={() => handleDelete(item.docId)} style={styles.deleteButton}>
                    <Ionicons name="trash" size={24} color="red" />
                </TouchableOpacity>
            }
            {
                item.status === "not-started" &&
                <TouchableOpacity style={styles.deleteButton}>
                    <Ionicons name="create-outline" size={24} color="red" />
                </TouchableOpacity>
            }
        </View>
    );

    return (
        <LinearGradient
            colors={['#fff', '#fff', '#0478A7']} // Sky blue, teal, dark green
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <Text style={styles.header}>Planned Tours</Text>
            
            <TouchableOpacity>
                <LinearGradient
                    colors={['#0478A7', '#0478A7', '#0478A7']} // Gradient shades of blue
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.planbutton}
                >
                    <Link href={'/plan'} style={styles.planText}>
                        New Tour
                    </Link>
                </LinearGradient>
            </TouchableOpacity>

            <FlatList
                data={trips}
                renderItem={renderItem}
                keyExtractor={(item) => item.docId}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 50,
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 20,
        textTransform: 'uppercase',
        color: '#0478A7', // Ensuring readability on the gradient
    },
    planbutton: {
        paddingVertical: 12,
        borderRadius: 8,
        width: 200,
        alignSelf: "center",
        alignItems: 'center',
    },
    planText: {
        color: "#fff",
        fontSize: 18,
        textAlign: "center",
        paddingVertical: 12,
        width: '100%',
    },
    tripItem: {
        padding: 15,
        marginVertical: 10,
        backgroundColor: '#0478A7', // Light transparency for readability
        borderRadius: 8,
        shadowColor: '#fff',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tripInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    tripLink: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    tripLocation: {
        fontSize: 25,
        fontWeight: '600',
        color: '#fff', // Tomato color
        textTransform: 'capitalize',
        marginRight: 10,
    },
    deleteButton: {
        padding: 8,
    },
});

export default HomeScreen;
