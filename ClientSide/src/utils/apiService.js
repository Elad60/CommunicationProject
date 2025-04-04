import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5137/api',
  timeout: 5000,
});

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

export default radioChannelsApi;


