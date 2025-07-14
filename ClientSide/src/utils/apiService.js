import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:7220/api',
  //baseURL: 'https://proj.ruppin.ac.il/cgroup90/test2/tar1/api',
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

  updateChannelState: async (userId, channelId, newState, pinCode) => {
    const body = pinCode ? {newState, pinCode} : {newState};
    await api.post(
      `/radiochannels/user/${userId}/channel/${channelId}/state`,
      body,
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

  addUserChannel: async (userId, channelId, pinCode) => {
    const body = pinCode ? {pinCode} : {};
    await api.post(
      `/radiochannels/user/${userId}/add-channel/${channelId}`,
      body,
    );
  },

  removeUserChannel: async (userId, channelId) => {
    await api.delete(
      `/radiochannels/user/${userId}/remove-channel/${channelId}`,
    );
  },

  getChannelParticipants: async channelId => {
    const response = await api.get(`/radiochannels/${channelId}/participants`);
    return response.data;
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

export {radioChannelsApi, authApi, adminApi, groupUsersApi, announcementsApi};
