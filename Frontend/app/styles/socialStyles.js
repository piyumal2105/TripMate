import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  fakeInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  postList: {
    marginTop: 10,
  },
  postContainer: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  postText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#444',
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginVertical: 10,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    marginRight: 5,
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
  },
  editDeleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  noPostsText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20,
    fontSize: 16,
  },

  // 🔹 Add Post Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: screenWidth * 0.9,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
  },
  imagePickerIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  textInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  addPostButton: {
    backgroundColor: '#0478A7', // Changed to your accent color
    padding: 12,
    borderRadius: 16,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelButton: {
    backgroundColor: '#888', // Changed to gray
    padding: 12,
    borderRadius: 16,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryButton: {
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categorySelected: {
    borderColor: '#0478A7', // Selected border color
    backgroundColor: '#e6f3f7', // Light blue background for selected
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  categoryTextSelected: {
    color: '#0478A7', // Selected text color
  },
});