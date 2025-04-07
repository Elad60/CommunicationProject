import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5137/api', // replace with your IP for physical devices
  timeout: 5000,
});

const radioChannelsApi = {
  // For Operators – get only their channels
  getUserChannels: async userId => {
    const response = await api.get(`/radiochannels/user/${userId}`);
    return response.data;
  },

  // For Admin/Technician – get all channels
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

  register: async (username, password, email) => {
    const response = await api.post(
      '/user/register',
      {
        username,
        password,
        email,
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


export {radioChannelsApi, authApi, adminApi};
