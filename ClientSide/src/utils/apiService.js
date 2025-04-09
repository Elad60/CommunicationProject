import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5137/api',
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
    const response = await api.post('/user/login', {
      username,
      password,
    });
    return response.data;
  },

  register: async (username, password, email,group) => {
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
// 👫 Group Users API
const groupUsersApi = {
  getUsersByGroup: async groupName => {
    const response = await api.get(`/user/group/${groupName}`);
    return response.data;
  },
  changeUserGroup: async (userId, newGroup) => {
    try {
      const response = await api.post(`/user/change-group/${userId}`, JSON.stringify(newGroup), {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error changing user group:', error);
      throw error;
    }
  },
};


export {radioChannelsApi, authApi, adminApi, groupUsersApi};
