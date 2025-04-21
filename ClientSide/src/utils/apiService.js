import axios from 'axios';

// Create a base axios instance for API calls
const api = axios.create({
  baseURL: 'http://localhost:7220/api',
  // 'http://194.90.158.74/cgroup90/test2/tar1/api'
  timeout: 5000,
});

// 📡 Radio Channels API
const radioChannelsApi = {
  // Fetch channels associated with a specific user
  getUserChannels: async userId => {
    const response = await api.get(`/radiochannels/user/${userId}`);
    return response.data;
  },

  // Fetch all available channels
  getAllChannels: async () => {
    const response = await api.get('/radiochannels');
    return response.data;
  },

  // Update a user's channel state
  updateChannelState: async (userId, channelId, newState) => {
    await api.post(
      `/radiochannels/user/${userId}/channel/${channelId}/state`,
      JSON.stringify(newState),
      {
        headers: {'Content-Type': 'application/json'},
      },
    );
  },

  // Add a new channel
  addChannel: async channel => {
    await api.post('/radiochannels', channel, {
      headers: {'Content-Type': 'application/json'},
    });
  },

  // Delete a channel by its ID
  deleteChannel: async channelId => {
    await api.delete(`/radiochannels/${channelId}`);
  },

  // Add a specific channel to a user's list
  addUserChannel: async (userId, channelId) => {
    await api.post(`/radiochannels/user/${userId}/add-channel/${channelId}`);
  },

  // Remove a specific channel from a user's list
  removeUserChannel: async (userId, channelId) => {
    await api.delete(
      `/radiochannels/user/${userId}/remove-channel/${channelId}`,
    );
  },
};

// 🔐 Auth API
const authApi = {
  // User login with credentials
  login: async (username, password) => {
    try {
      const response = await api.post('/user/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw {response: {data: error.response.data}};
      }
      throw error;
    }
  },

  // User logout by ID
  logout: async userId => {
    const response = await api.post(`/user/logout/${userId}`);
    return response.data;
  },

  // Register a new user
  register: async (username, password, email, group) => {
    try {
      const response = await api.post(
        '/user/register',
        {
          username,
          password,
          email,
          group,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('Registration error (server):', error.response.data);
        return error.response.data;
      }
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  },
};

// 🔒 Admin API
const adminApi = {
  // Fetch all registered users
  getAllUsers: async () => {
    const response = await api.get('/user/all');
    return response.data;
  },

  // Block or unblock a user
  blockUser: async (userId, isBlocked) => {
    await api.post(`/user/block/${userId}`, isBlocked, {
      headers: {'Content-Type': 'application/json'},
    });
  },

  // Update the role of a user
  updateUserRole: async (userId, newRole) => {
    await api.post(
      '/user/update-role',
      {userId, newRole},
      {
        headers: {'Content-Type': 'application/json'},
      },
    );
  },

  // Delete a user by ID
  deleteUser: async userId => {
    await api.delete(`/user/${userId}`);
  },
};

// 📢 Announcements API
const announcementsApi = {
  // Fetch all announcements
  getAll: async () => {
    const response = await api.get('/Announcement/announcements');
    return response.data;
  },

  // Create a new announcement
  add: async (title, content, userName) => {
    const response = await api.post('/Announcement/announcement', {
      title,
      content,
      userName,
    });
    return response.data;
  },

  // Fetch announcements with read status for a user
  getAllWithReadStatus: async userId => {
    const response = await api.get(
      `/Announcement/announcements/withReadStatus/${userId}`,
    );
    return response.data;
  },

  // Mark all announcements as read for a user
  markAllAsRead: async userId => {
    const response = await api.post(
      `/Announcement/announcements/markAllAsRead/${userId}`,
    );
    return response.data;
  },

  // Get count of unread announcements for a user
  getUnreadCount: async userId => {
    const response = await api.get(
      `/Announcement/announcements/unreadCount/${userId}`,
    );
    return response.data;
  },
};

// 👫 Group Users API
const groupUsersApi = {
  // Get all users in a specific group
  getUsersByGroup: async groupName => {
    const response = await api.get(`/user/group/${groupName}`);
    return response.data;
  },

  // Change the group of a specific user
  changeUserGroup: async (userId, newGroup) => {
    try {
      const response = await api.post(
        `/user/change-group/${userId}`,
        JSON.stringify(newGroup),
        {
          headers: {'Content-Type': 'application/json'},
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error changing user group:', error);
      throw error;
    }
  },
};

// Export all grouped APIs
export {radioChannelsApi, authApi, adminApi, groupUsersApi, announcementsApi};
