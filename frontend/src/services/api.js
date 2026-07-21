import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Important: Sends HTTP-only cookies with requests
});

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // You can add logic here to redirect to login if unauthorized
      console.warn('Unauthorized access. Please login again.');
      // window.location.href = '/login'; // Or use Vue Router programmatically if needed
    }
    return Promise.reject(error);
  }
);

export default api;
