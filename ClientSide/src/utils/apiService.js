import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5137/api',
  timeout: 5000,
});

const radioChannelsApi = {
  getAllChannels: async () => {
    const response = await api.get('/radiochannels');
    return response.data;
  },
};

export default radioChannelsApi;
