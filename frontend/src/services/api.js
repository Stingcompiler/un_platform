import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor with silent refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't retry for auth endpoints or if already retried
        const isAuthEndpoint = originalRequest.url?.includes('/auth/me') ||
            originalRequest.url?.includes('/auth/refresh');

        // If 401 and not an auth endpoint and not already retrying
        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                await axios.post('/api/auth/refresh/', {}, { withCredentials: true });
                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - just reject, don't redirect
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
