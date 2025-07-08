import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:7220/api',
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

// 📞 Private Call API - Updated to work with C# API
const privateCallApi = {
  // Send call invitation to another user
  sendCallInvitation: async (callerId, receiverId) => {
    try {
      console.log('🔧 API: Sending call invitation...');
      console.log('📊 API: callerId:', callerId, 'receiverId:', receiverId);
      console.log('🌐 API: URL:', api.defaults.baseURL + '/PrivateCalls/send');
      
      const requestData = {
        callerId,
        receiverId,
      };
      console.log('📤 API: Request data:', requestData);
      
      const response = await api.post('/PrivateCalls/send', requestData);
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
  acceptCallInvitation: async (invitationId, userId) => {
    try {
      const requestData = {
        invitationId,
        userId,
      };
      const response = await api.post('/PrivateCalls/accept', requestData);
      return response.data;
    } catch (error) {
      console.error('Error accepting call invitation:', error);
      throw error;
    }
  },

  // Reject incoming call invitation
  rejectCallInvitation: async (invitationId, userId) => {
    try {
      const requestData = {
        invitationId,
        userId,
      };
      const response = await api.post('/PrivateCalls/reject', requestData);
      return response.data;
    } catch (error) {
      console.error('Error rejecting call invitation:', error);
      throw error;
    }
  },

  // Cancel outgoing call invitation
  cancelCallInvitation: async (invitationId, userId) => {
    try {
      const requestData = {
        invitationId,
        userId,
      };
      const response = await api.post('/PrivateCalls/cancel', requestData);
      return response.data;
    } catch (error) {
      console.error('Error canceling call invitation:', error);
      throw error;
    }
  },

  // Check for incoming call invitations
  checkIncomingCalls: async (userId) => {
    try {
      const response = await api.get(`/PrivateCalls/incoming/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking incoming calls:', error);
      throw error;
    }
  },

  // Check outgoing call status
  checkOutgoingCallStatus: async (invitationId, userId) => {
    try {
      const response = await api.get(`/PrivateCalls/status/${invitationId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking outgoing call status:', error);
      throw error;
    }
  },

  // Get call status - Updated to match new API
  getCallStatus: async (invitationId, userId) => {
    try {
      const response = await api.get(`/PrivateCalls/status/${invitationId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting call status:', error);
      throw error;
    }
  },

  // End a private call - Updated to match new API
  endCall: async (invitationId, endReason = 'completed') => {
    try {
      const requestData = {
        invitationId,
        endReason,
      };
      const response = await api.post('/PrivateCalls/end', requestData);
      return response.data;
    } catch (error) {
      console.error('Error ending private call:', error);
      throw error;
    }
  },

  // Get call statistics for a user (replaces getCallHistory)
  getUserCallStats: async (userId, daysBack = 30) => {
    try {
      const response = await api.get(`/PrivateCalls/stats/${userId}?daysBack=${daysBack}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user call stats:', error);
      throw error;
    }
  },

  // Cleanup old invitations (maintenance function)
  cleanupOldInvitations: async (daysToKeep = 7) => {
    try {
      const response = await api.post(`/PrivateCalls/cleanup?daysToKeep=${daysToKeep}`);
      return response.data;
    } catch (error) {
      console.error('Error cleaning up old invitations:', error);
      throw error;
    }
  },

  // Legacy function for backward compatibility
  startCall: async (callerId, receiverId) => {
    // This function is now handled by the invitation flow
    console.warn('startCall is deprecated. Use sendCallInvitation instead.');
    return await privateCallApi.sendCallInvitation(callerId, receiverId);
  },

  // Legacy function for backward compatibility  
  getCallHistory: async (userId) => {
    // Redirect to new stats function
    console.warn('getCallHistory is deprecated. Use getUserCallStats instead.');
    return await privateCallApi.getUserCallStats(userId);
  },

  // Legacy function for backward compatibility
  checkUserAvailability: async (userId) => {
    // Check if user has pending invitations
    console.warn('checkUserAvailability is deprecated. Use checkIncomingCalls instead.');
    const result = await privateCallApi.checkIncomingCalls(userId);
    return {
      available: result.count === 0,
      pendingCalls: result.count,
    };
  },
};

export {radioChannelsApi, authApi, adminApi, groupUsersApi, announcementsApi, privateCallApi};
