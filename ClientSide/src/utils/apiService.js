import axios from 'axios';

const api = axios.create({
  baseURL: 'https://proj.ruppin.ac.il/cgroup90/test2/tar1/api',
  timeout: 5000,
});

const radioChannelsApi = {
  getUserChannels: async userId => {
    const response = await api.get(`/radiochannels/user/${userId}`);
    return response.data;
  },

  getAllChannels: async () => {
    const response = await api.get('/radiochannels');
    return response.data;
  },

  updateChannelState: async (userId, channelId, newState) => {
    await api.post(
      `/radiochannels/user/${userId}/channel/${channelId}/state`,
      JSON.stringify(newState),
      {
        headers: {'Content-Type': 'application/json'},
      },
    );
  },

  addChannel: async channel => {
    await api.post('/radiochannels', channel, {
      headers: {'Content-Type': 'application/json'},
    });
  },

  deleteChannel: async channelId => {
    await api.delete(`/radiochannels/${channelId}`);
  },

  addUserChannel: async (userId, channelId) => {
    await api.post(`/radiochannels/user/${userId}/add-channel/${channelId}`);
  },

  removeUserChannel: async (userId, channelId) => {
    await api.delete(
      `/radiochannels/user/${userId}/remove-channel/${channelId}`,
    );
  },
};

// 🔐 Auth API
const authApi = {
  login: async (username, password) => {
    try {
      const response = await api.post('/user/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      // If we have a response with data, return that data
      if (error.response && error.response.data) {
        throw {response: {data: error.response.data}};
      }
      // Otherwise, throw a more general error
      throw error;
    }
  },

  logout: async userId => {
    const response = await api.post(`/user/logout/${userId}`);
    return response.data;
  },

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
      // If we have a response with data, return that data
      if (error.response && error.response.data) {
        console.error('Registration error (server):', error.response.data);
        return error.response.data;
      }
      // Otherwise, return a generic error
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
  getAllUsers: async () => {
    const response = await api.get('/user/all'); // 🔧 FIXED endpoint
    return response.data;
  },
  blockUser: async (userId, isBlocked) => {
    await api.post(`/user/block/${userId}`, isBlocked, {
      headers: {'Content-Type': 'application/json'},
    });
  },
  updateUserRole: async (userId, newRole) => {
    await api.post(
      '/user/update-role',
      {userId, newRole},
      {
        headers: {'Content-Type': 'application/json'},
      },
    );
  },
  deleteUser: async userId => {
    await api.delete(`/user/${userId}`);
  },
};

// 📢 Announcements API
const announcementsApi = {
  getAll: async () => {
    const response = await api.get('/Announcement/announcements');
    return response.data;
  },

  add: async (title, content, userName) => {
    const response = await api.post('/Announcement/announcement', {
      title,
      content,
      userName,
    });
    return response.data;
  },
  getAllWithReadStatus: async userId => {
    const response = await api.get(
      `/Announcement/announcements/withReadStatus/${userId}`,
    );
    return response.data;
  },

  markAllAsRead: async userId => {
    const response = await api.post(
      `/Announcement/announcements/markAllAsRead/${userId}`,
    );
    return response.data;
  },

  getUnreadCount: async userId => {
    const response = await api.get(
      `/Announcement/announcements/unreadCount/${userId}`,
    );
    return response.data;
  },
};

// 👫 Group Users API
const groupUsersApi = {
  getUsersByGroup: async groupName => {
    const response = await api.get(`/user/group/${groupName}`);
    return response.data;
  },
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

// 📞 Private Call API
const privateCallApi = {
  // Send call invitation to another user
  sendCallInvitation: async (callerId, receiverId) => {
    try {
      console.log('🔧 API: Sending call invitation...');
      console.log('📊 API: callerId:', callerId, 'receiverId:', receiverId);
      console.log('🌐 API: URL:', api.defaults.baseURL + '/private-call/invite');
      
      const requestData = {
        callerId,
        receiverId,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      console.log('📤 API: Request data:', requestData);
      
      const response = await api.post('/private-call/invite', requestData);
      console.log('✅ API: Success response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Error sending call invitation');
      console.error('📋 API: Error status:', error.response?.status);
      console.error('📋 API: Error data:', error.response?.data);
      console.error('📋 API: Error message:', error.message);
      console.error('📋 API: Full error:', error);
      
      // Create a more informative error
      const enhancedError = new Error(
        `API Error: ${error.response?.status || 'Network'} - ${error.response?.data?.message || error.message}`
      );
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  // Accept incoming call invitation
  acceptCallInvitation: async (invitationId) => {
    try {
      const response = await api.post(`/private-call/accept/${invitationId}`, {
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting call invitation:', error);
      throw error;
    }
  },

  // Reject incoming call invitation
  rejectCallInvitation: async (invitationId) => {
    try {
      const response = await api.post(`/private-call/reject/${invitationId}`, {
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting call invitation:', error);
      throw error;
    }
  },

  // Cancel outgoing call invitation
  cancelCallInvitation: async (invitationId) => {
    try {
      const response = await api.post(`/private-call/cancel/${invitationId}`, {
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling call invitation:', error);
      throw error;
    }
  },

  // Check for incoming call invitations
  checkIncomingCalls: async (userId) => {
    try {
      const response = await api.get(`/private-call/incoming/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking incoming calls:', error);
      throw error;
    }
  },

  // Check outgoing call status
  checkOutgoingCallStatus: async (invitationId) => {
    try {
      const response = await api.get(`/private-call/status/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking outgoing call status:', error);
      throw error;
    }
  },

  // Start a private call between two users (legacy - after both accepted)
  startCall: async (callerId, receiverId) => {
    try {
      const response = await api.post('/private-call/start', {
        callerId,
        receiverId,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error starting private call:', error);
      throw error;
    }
  },

  // End a private call
  endCall: async (callId) => {
    try {
      const response = await api.post(`/private-call/end/${callId}`, {
        endTime: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error ending private call:', error);
      throw error;
    }
  },

  // Get call status
  getCallStatus: async (callId) => {
    try {
      const response = await api.get(`/private-call/status/${callId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting call status:', error);
      throw error;
    }
  },

  // Get call history for a user
  getCallHistory: async (userId) => {
    try {
      const response = await api.get(`/private-call/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting call history:', error);
      throw error;
    }
  },

  // Check if user is available for calls
  checkUserAvailability: async (userId) => {
    try {
      const response = await api.get(`/private-call/availability/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking user availability:', error);
      throw error;
    }
  },
};

export {radioChannelsApi, authApi, adminApi, groupUsersApi, announcementsApi, privateCallApi};
