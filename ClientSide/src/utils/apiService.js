import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5137/api', // replace with your IP for physical devices
  timeout: 5000,
});

// 📡 Radio Channels
const radioChannelsApi = {
  getAllChannels: async userId => {
    const response = await api.get(`/radiochannels/user/${userId}`);
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
          'Content-Type': 'application/json', // 👈 ensure JSON
        },
      },
    );
    return response.data;
  },
};

export {radioChannelsApi, authApi};
