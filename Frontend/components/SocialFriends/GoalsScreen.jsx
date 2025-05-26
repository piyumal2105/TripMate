import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Dimensions, Image } from 'react-native';
import { doc, getDoc, getDocs, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { styles as socialStyles } from '../../app/styles/socialStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const GoalsScreen = () => {
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchGoals = () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("No authenticated user found for fetching goals.");
        return;
      }

      console.log(`Fetching goals for user: ${user.uid}`);
      const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userGoals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Raw goals data from Firestore:", userGoals.map(goal => ({
          id: goal.id,
          category: goal.category,
          type: goal.type,
          target: goal.target,
          progress: goal.progress,
          completed: goal.completed,
          createdAt: goal.createdAt ? goal.createdAt.toDate().toISOString() : 'No creation date',
          expiresAt: goal.expiresAt ? goal.expiresAt.toDate().toISOString() : 'No expiry date'
        })));
        const filteredGoals = userGoals.filter(goal => !goal.completed && goal.expiresAt && new Date(goal.expiresAt.toDate()) > new Date());
        console.log("Filtered goals to render:", filteredGoals.map(goal => ({
          id: goal.id,
          category: goal.category,
          type: goal.type,
          target: goal.target,
          progress: goal.progress,
          completed: goal.completed,
          createdAt: goal.createdAt ? goal.createdAt.toDate().toISOString() : 'No creation date',
          expiresAt: goal.expiresAt.toDate().toISOString()
        })));
        setGoals(filteredGoals);
      }, (error) => {
        console.error('Error fetching goals:', error.message);
      });
      return unsubscribe;
    };

    const fetchLeaderboard = () => {
      console.log("Fetching leaderboard data...");
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          userId: doc.id,
          fullName: doc.data().fullName || 'Anonymous',
          points: doc.data().points || 0,
        }));
        users.sort((a, b) => b.points - a.points);
        console.log("Leaderboard (all users):", users.map(user => ({
          userId: user.userId,
          fullName: user.fullName,
          points: user.points
        })));
        setLeaderboard(users);
      }, (error) => {
        console.error('Error fetching leaderboard:', error.message);
      });
      return unsubscribe;
    };

    const unsubscribeGoals = fetchGoals();
    const unsubscribeLeaderboard = fetchLeaderboard();

    return () => {
      unsubscribeGoals && unsubscribeGoals();
      unsubscribeLeaderboard && unsubscribeLeaderboard();
    };
  }, [refreshTrigger]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || goals.length === 0) {
      console.log("No user or goals to check progress for.");
      return;
    }

    console.log(`Setting up post listener for user: ${user.uid}`);
    const postQuery = query(collection(db, 'posts'), where('userId', '==', user.uid));
    const unsubscribePosts = onSnapshot(postQuery, async (postSnapshot) => {
      const posts = postSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("Fetched posts for progress tracking:", posts.map(post => ({
        id: post.id,
        categories: post.categories,
        category: post.category,
        tag: post.tag,
        tags: post.tags,
        userId: post.userId,
        createdAt: post.createdAt ? post.createdAt.toDate().toISOString() : 'No creation date'
      })));

      for (const goal of goals) {
        console.log(`Checking progress for goal ${goal.id}: ${goal.type} ${goal.target} in ${goal.category}`);
        let progress = 0;

        const normalizedType = goal.type.trim().toLowerCase();
        if (normalizedType === 'post' || normalizedType === 'post_count') {
          const goalCategory = goal.category.toLowerCase().trim();
          const goalCreatedAt = goal.createdAt ? goal.createdAt.toDate() : new Date(0); // Fallback to epoch if no createdAt
          console.log(`Looking for posts in category: "${goalCategory}" created after ${goalCreatedAt.toISOString()}`);
          
          progress = posts.filter(post => {
            const postCreatedAt = post.createdAt ? post.createdAt.toDate() : new Date(0);
            if (postCreatedAt < goalCreatedAt) {
              console.log(`Post ${post.id} excluded: created at ${postCreatedAt.toISOString()} before goal creation ${goalCreatedAt.toISOString()}`);
              return false;
            }

            if (post.categories && Array.isArray(post.categories)) {
              const hasMatchingCategory = post.categories.some(category => 
                category.toLowerCase().trim() === goalCategory
              );
              if (hasMatchingCategory) {
                console.log(`Post ${post.id} matches with categories:`, post.categories);
              }
              return hasMatchingCategory;
            }
            if (post.category && typeof post.category === 'string') {
              const matches = post.category.toLowerCase().trim() === goalCategory;
              if (matches) {
                console.log(`Post ${post.id} matches with category: "${post.category}"`);
              }
              return matches;
            }
            if (post.tag && typeof post.tag === 'string') {
              const matches = post.tag.toLowerCase().trim() === goalCategory;
              if (matches) {
                console.log(`Post ${post.id} matches with tag: "${post.tag}"`);
              }
              return matches;
            }
            if (post.tags && Array.isArray(post.tags)) {
              const hasMatchingTag = post.tags.some(tag => 
                tag.toLowerCase().trim() === goalCategory
              );
              if (hasMatchingTag) {
                console.log(`Post ${post.id} matches with tags:`, post.tags);
              }
              return hasMatchingTag;
            }
            console.log(`Post ${post.id} has no matching category. Available fields:`, Object.keys(post));
            return false;
          }).length;
          
          console.log(`Goal ${goal.id} - Total matching posts for category "${goal.category}": ${progress}`);
        } else if (goal.type === 'likes') {
          try {
            const likeQuery = query(collection(db, 'posts'), where('likedBy', 'array-contains', user.uid));
            const likeSnapshot = await getDocs(likeQuery);
            const likedPosts = likeSnapshot.docs.map(doc => doc.data());
            const goalCategory = goal.category.toLowerCase().trim();
            
            progress = likedPosts.filter(post => {
              if (post.categories && Array.isArray(post.categories)) {
                return post.categories.some(category => 
                  category.toLowerCase().trim() === goalCategory
                );
              }
              if (post.category && typeof post.category === 'string') {
                return post.category.toLowerCase().trim() === goalCategory;
              }
              if (post.tag && typeof post.tag === 'string') {
                return post.tag.toLowerCase().trim() === goalCategory;
              }
              if (post.tags && Array.isArray(post.tags)) {
                return post.tags.some(tag => 
                  tag.toLowerCase().trim() === goalCategory
                );
              }
              return false;
            }).length;
            
            console.log(`Goal ${goal.id} - Matching likes for category "${goal.category}": ${progress}`);
          } catch (error) {
            console.error(`Error fetching likes for goal ${goal.id}:`, error.message);
          }
        } else if (goal.type === 'friends') {
          try {
            const friendQuery = query(collection(db, 'friends', user.uid, 'friendList'));
            const friendSnapshot = await getDocs(friendQuery);
            progress = friendSnapshot.docs.length;
            console.log(`Goal ${goal.id} - Number of friends: ${progress}`);
          } catch (error) {
            console.error(`Error fetching friends for goal ${goal.id}:`, error.message);
          }
        }

        if (progress !== goal.progress) {
          console.log(`Updating progress for goal ${goal.id} from ${goal.progress} to ${progress}`);
          const goalRef = doc(db, 'goals', goal.id);
          const completed = progress >= goal.target;
          
          try {
            await updateDoc(goalRef, { 
              progress, 
              completed,
              lastUpdated: new Date()
            });
            console.log(`Successfully updated Firestore for goal ${goal.id}: progress=${progress}, completed=${completed}`);
            setRefreshTrigger(prev => prev + 1);
          } catch (error) {
            console.error(`Error updating goal ${goal.id}:`, error.message);
          }

          if (completed && !goal.completed) {
            console.log(`Goal ${goal.id} completed! Awarding 50 points.`);
            try {
              const userRef = doc(db, 'users', user.uid);
              const userDoc = await getDoc(userRef);
              let points = userDoc.exists() ? userDoc.data().points || 0 : 0;
              points += 50;
              await updateDoc(userRef, { points });
              Alert.alert('Goal Completed!', `You completed your goal: ${goal.type.replace('_', ' ')} ${goal.target} times in ${goal.category}! +50 points`);
            } catch (pointsError) {
              console.error('Error awarding points:', pointsError.message);
            }
          }
        } else {
          console.log(`No progress update needed for goal ${goal.id}. Current progress: ${progress}`);
        }
      }
    }, (error) => {
      console.error('Error in post listener for progress tracking:', error.message);
    });

    return () => unsubscribePosts && unsubscribePosts();
  }, [goals, refreshTrigger]);

  const formatTimeLeft = (expiresAt) => {
    if (!expiresAt) return 'No expiry date';
    const now = new Date();
    const expireDate = expiresAt.toDate();
    const diffInMs = expireDate - now;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffInMs < 0) return 'Expired';
    return `${diffInDays}d ${diffInHours}h ${diffInMinutes}m left`;
  };

  const currentUser = auth.currentUser;
  const topThree = leaderboard.slice(0, 3);
  const remainingUsers = leaderboard.slice(3);

  const getCrownColor = (index) => {
    switch(index) {
      case 0: return '#FFD700'; // Gold
      case 1: return '#C0C0C0'; // Silver
      case 2: return '#CD7F32'; // Bronze
      default: return '#FFD700';
    }
  };

  const getPodiumColor = (index) => {
    switch(index) {
      case 0: return '#5A9BCF'; // Lighter blue for 1st
      case 1: return '#036589'; // Slightly darker for 2nd
      case 2: return '#024C6A'; // Even darker for 3rd
      default: return '#5A9BCF';
    }
  };

  const renderTopThreeItem = (item, index) => (
    <View key={item.userId} style={localStyles.podiumContainer}>
      <MaterialCommunityIcons
        name="crown"
        size={index === 0 ? 32 : 24}
        color={getCrownColor(index)}
        style={localStyles.crown}
      />
      <View style={[localStyles.profileImageContainer, index === 0 && localStyles.firstPlaceProfile]}>
        <Image
          source={require('../../assets/images/profilepicture.png')}
          style={[localStyles.profileImage, index === 0 && localStyles.firstPlaceImage]}
        />
      </View>
      <View style={[
        localStyles.podiumCard,
        { backgroundColor: getPodiumColor(index) },
        index === 0 && localStyles.firstPlacePodium,
        item.userId === currentUser?.uid && localStyles.currentUserGlow,
        index === 0 ? localStyles.firstPlaceCard : localStyles.secondaryCard,
      ]}>
        <Text style={[localStyles.podiumName, index !== 0 && localStyles.secondaryText]} numberOfLines={1}>
          {item.userId === currentUser?.uid ? `You ` : item.fullName}
        </Text>
        <Text style={[localStyles.podiumPoints, index !== 0 && localStyles.secondaryText]}>{item.points}</Text>
        <Text style={localStyles.podiumRank}>{index + 1}</Text>
      </View>
    </View>
  );

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    console.log("Forced refresh triggered");
  };

  return (
    <LinearGradient
      colors={['#0478A7', '#87CEEB']}
      style={localStyles.container}
    >
      <View style={localStyles.header}>
        <TouchableOpacity
          style={localStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Leaderboards</Text>
        <TouchableOpacity
          style={localStyles.backButton}
          onPress={forceRefresh}
        >
          <Ionicons name="refresh" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={localStyles.content}>
        <View style={localStyles.goalsSection}>
          <Text style={localStyles.sectionTitle}>Your Active Goals</Text>
          {goals.length === 0 ? (
            <Text style={localStyles.noDataText}>No active goals. Set a new goal from the feed!</Text>
          ) : (
            <FlatList
              data={goals}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const progressPercentage = (item.progress / item.target) * 100 || 0;
                console.log(`Rendering goal ${item.id}: Progress ${item.progress}/${item.target} (${progressPercentage}%)`);
                return (
                  <View style={localStyles.goalCard}>
                    <Text style={localStyles.goalText} numberOfLines={2}>
                      {`${item.type?.replace('_', ' ') || 'Unknown'} ${item.target || 0} posts under ${item.category || 'Unknown'} category`}
                    </Text>
                    <View style={localStyles.progressContainer}>
                      <View style={localStyles.progressBarBackground}>
                        <View style={[
                          localStyles.progressBarFill,
                          { width: `${progressPercentage}%` }
                        ]} />
                      </View>
                      <Text style={localStyles.progressText}>
                        {`${item.progress || 0}/${item.target || 0}`}
                      </Text>
                    </View>
                    <Text style={localStyles.expiryText} numberOfLines={1}>
                      {formatTimeLeft(item.expiresAt)}
                    </Text>
                  </View>
                );
              }}
              keyExtractor={(item) => item.id}
              contentContainerStyle={localStyles.goalsListContainer}
            />
          )}
        </View>

        {topThree.length > 0 && (
          <View style={localStyles.podiumSection}>
            <View style={localStyles.podiumWrapper}>
              {topThree[1] && renderTopThreeItem(topThree[1], 1)}
              {topThree[0] && renderTopThreeItem(topThree[0], 0)}
              {topThree[2] && renderTopThreeItem(topThree[2], 2)}
            </View>
          </View>
        )}

        {remainingUsers.length > 0 && (
          <View style={localStyles.listSection}>
            <FlatList
              data={remainingUsers}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <View style={[
                  localStyles.userRow,
                  item.userId === currentUser?.uid && localStyles.currentUserRow
                ]}>
                  <View style={localStyles.userRankContainer}>
                    <MaterialCommunityIcons 
                      name="star" 
                      size={20} 
                      color="#FFD700" 
                      style={localStyles.starIcon} 
                    />
                    <Text style={localStyles.rankNumber}>{index + 4}</Text>
                  </View>
                  <Image
                    source={require('../../assets/images/profilepicture.png')}
                    style={localStyles.userAvatar}
                  />
                  <View style={localStyles.userInfo}>
                    <Text style={localStyles.userName} numberOfLines={1}>
                      {item.userId === currentUser?.uid ? `(You) ${item.fullName}` : item.fullName}
                    </Text>
                  </View>
                  <Text style={localStyles.userPoints}>{item.points}</Text>
                </View>
              )}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={localStyles.listContainer}
            />
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  goalsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 5,
  },
  goalsListContainer: {
    paddingRight: 20,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0478A7',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  expiryText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  podiumSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  podiumWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 200,
  },
  podiumContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    flex: 1,
  },
  firstPlaceCard: {
    width: (width - 100) / 2.5,
    padding: 15,
    paddingTop: 40,
  },
  secondaryCard: {
    width: (width - 100) / 3,
    padding: 10,
    paddingTop: 35,
  },
  crown: {
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileImageContainer: {
    marginBottom: -20,
    zIndex: 2,
  },
  firstPlaceProfile: {
    transform: [{ scale: 1.1 }],
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  firstPlaceImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  podiumCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  firstPlacePodium: {
    height: 120,
    transform: [{ scale: 1.05 }],
  },
  currentUserGlow: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  secondaryText: {
    fontSize: 12,
  },
  podiumPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  podiumRank: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listSection: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentUserRow: {
    backgroundColor: '#0478A7',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  userRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  starIcon: {
    marginRight: 5,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0478A7',
  },
});

export default GoalsScreen;