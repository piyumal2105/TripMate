import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ToastAndroid
} from 'react-native';
import { Link } from 'expo-router';
import { db } from '../configs/FirebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

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
            colors={['#81c1ff', '#49a09d', '#1f4037']} // Sky blue, teal, dark green
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <Text style={styles.header}>Planned Tours</Text>
            
            <TouchableOpacity>
                <LinearGradient
                    colors={['#8E2DE2', '#3b5998', '#192f6a']} // Gradient shades of blue
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
        fontFamily: 'sans-serif-light',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 20,
        textTransform: 'uppercase',
        color: '#fff', // Ensuring readability on the gradient
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Light transparency for readability
        borderRadius: 8,
        shadowColor: '#000',
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
        color: '#FF6347', // Tomato color
        textTransform: 'capitalize',
        marginRight: 10,
    },
    deleteButton: {
        padding: 8,
    },
});

export default HomeScreen;
