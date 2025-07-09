import axios from 'axios';

// Create a pre-configured axios instance with base URL and timeout
const api = axios.create({
  baseURL: 'https://proj.ruppin.ac.il/cgroup90/test2/tar1/api',
  timeout: 5000,
});

// 📻 Radio Channels API
const radioChannelsApi = {
  // Get all channels assigned to a specific user
  getUserChannels: async userId => {
    const response = await api.get(`/radiochannels/user/${userId}`);
    return response.data;
  },

  // Get all available radio channels
  getAllChannels: async () => {
    const response = await api.get('/radiochannels');
    return response.data;
  },

  // Update the state of a specific channel for a user
  updateChannelState: async (userId, channelId, newState) => {
    await api.post(
      `/radiochannels/user/${userId}/channel/${channelId}/state`,
      JSON.stringify(newState),
      {
        headers: {'Content-Type': 'application/json'},
      },
    );
  },

  // Add a new radio channel
  addChannel: async channel => {
    await api.post('/radiochannels', channel, {
      headers: {'Content-Type': 'application/json'},
    });
  },

  // Delete an existing radio channel
  deleteChannel: async channelId => {
    await api.delete(`/radiochannels/${channelId}`);
  },

  // Assign a channel to a specific user
  addUserChannel: async (userId, channelId) => {
    await api.post(`/radiochannels/user/${userId}/add-channel/${channelId}`);
  },

  // Remove a channel from a specific user
  removeUserChannel: async (userId, channelId) => {
    await api.delete(
      `/radiochannels/user/${userId}/remove-channel/${channelId}`,
    );
  },
};

// 🔐 Authentication API
const authApi = {
  // Handle user login
  login: async (username, password) => {
    try {
      const response = await api.post('/user/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      // Return specific error from server if exists
      if (error.response && error.response.data) {
        throw {response: {data: error.response.data}};
      }
      // Generic fallback error
      throw error;
    }
  },

  // Log out the current user
  logout: async userId => {
    const response = await api.post(`/user/logout/${userId}`);
    return response.data;
  },

  // Handle new user registration
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
      // Return detailed error from server if available
      if (error.response && error.response.data) {
        console.error('Registration error (server):', error.response.data);
        return error.response.data;
      }
      // Return generic error message
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  },
};

// 🛡️ Admin API
const adminApi = {
  // Get all users in the system
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

  // Change the role of a user (e.g., Admin, Technician)
  updateUserRole: async (userId, newRole) => {
    await api.post(
      '/user/update-role',
      {userId, newRole},
      {
        headers: {'Content-Type': 'application/json'},
      },
    );
  },

  // Permanently delete a user
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

  // Post a new announcement
  add: async (title, content, userName) => {
    const response = await api.post('/Announcement/announcement', {
      title,
      content,
      userName,
    });
    return response.data;
  },

  // Fetch all announcements including their read/unread status for a user
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

  // Get the number of unread announcements for a user
  getUnreadCount: async userId => {
    const response = await api.get(
      `/Announcement/announcements/unreadCount/${userId}`,
    );
    return response.data;
  },
};

// 👥 Group Users API
const groupUsersApi = {
  // Get all users that belong to a specific group
  getUsersByGroup: async groupName => {
    const response = await api.get(`/user/group/${groupName}`);
    return response.data;
  },

  // Change a user's group (e.g., from A to B)
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

// 📞 Private Calls API
const privateCallApi = {
  // Send a private call invitation to another user
  sendInvitation: async (callerId, receiverId) => {
    try {
      const response = await api.post('/PrivateCalls/send', {
        callerId,
        receiverId,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending call invitation:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: 'Failed to send call invitation. Please try again.',
      };
    }
  },

  // Get incoming call invitations for a user
  getIncomingCalls: async (userId) => {
    try {
      const response = await api.get(`/PrivateCalls/incoming/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching incoming calls:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        incomingCalls: [],
        count: 0,
      };
    }
  },

  // Accept a private call invitation
  acceptInvitation: async (invitationId, userId) => {
    try {
      const response = await api.post('/PrivateCalls/accept', {
        invitationId,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting call invitation:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: 'Failed to accept call invitation. Please try again.',
      };
    }
  },

  // Reject a private call invitation
  rejectInvitation: async (invitationId, userId) => {
    try {
      const response = await api.post('/PrivateCalls/reject', {
        invitationId,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting call invitation:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: 'Failed to reject call invitation. Please try again.',
      };
    }
  },

  // Cancel a private call invitation (for caller)
  cancelInvitation: async (invitationId, userId) => {
    try {
      const response = await api.post('/PrivateCalls/cancel', {
        invitationId,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling call invitation:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: 'Failed to cancel call invitation. Please try again.',
      };
    }
  },

  // Get the status of a private call invitation
  getCallStatus: async (invitationId, userId) => {
    try {
      const response = await api.get(`/PrivateCalls/status/${invitationId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching call status:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        status: 'unknown',
      };
    }
  },

  // End a private call
  endCall: async (invitationId, endReason = 'completed') => {
    try {
      const response = await api.post('/PrivateCalls/end', {
        invitationId,
        endReason,
      });
      return response.data;
    } catch (error) {
      console.error('Error ending call:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: 'Failed to end call. Please try again.',
      };
    }
  },

  // Get call statistics for a user (optional - for future use)
  getUserStats: async (userId, daysBack = 30) => {
    try {
      const response = await api.get(`/PrivateCalls/stats/${userId}?daysBack=${daysBack}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user call stats:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        stats: null,
      };
    }
  },
};

// Export all API modules for use throughout the app
export {radioChannelsApi, authApi, adminApi, groupUsersApi, announcementsApi, privateCallApi};
