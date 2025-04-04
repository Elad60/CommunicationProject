// In-memory storage (will be reset when app restarts)
let users = [];
let currentUser = null;

// Helper to get all registered users
export const getUsers = async () => {
  return users;
};

// Register a new user
export const registerUser = async (username, password, email) => {
  try {
    // Check if username already exists
    if (users.some(user => user.username === username)) {
      return {success: false, message: 'Username already exists'};
    }

    // Add new user
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      email,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    return {success: true, user: {id: newUser.id, username, email}};
  } catch (error) {
    console.error('Error registering user:', error);
    return {success: false, message: 'Registration failed'};
  }
};

// Login user
export const loginUser = async (username, password) => {
  try {
    const user = users.find(
      u => u.username === username && u.password === password,
    );

    if (!user) {
      return {success: false, message: 'Invalid username or password'};
    }

    // Save current user
    currentUser = {id: user.id, username: user.username, email: user.email};

    return {success: true, user: currentUser};
  } catch (error) {
    console.error('Error logging in:', error);
    return {success: false, message: 'Login failed'};
  }
};

// Check if user is logged in
export const getCurrentUser = async () => {
  return currentUser;
};

// Logout user
export const logoutUser = async () => {
  try {
    currentUser = null;
    return {success: true};
  } catch (error) {
    console.error('Error logging out:', error);
    return {success: false, message: 'Logout failed'};
  }
};

// Add a default user for testing
users.push({
  id: '1',
  username: 'admin',
  password: 'password',
  email: 'admin@example.com',
  createdAt: new Date().toISOString(),
});
