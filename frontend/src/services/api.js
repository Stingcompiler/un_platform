import axios from 'axios';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://platform.eust.edu.sd/api',
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

        // Only skip refresh for the refresh endpoint itself (prevents infinite loops)
        const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');

        // If 401 and not the refresh endpoint and not already retrying
        if (error.response?.status === 401 && !isRefreshEndpoint && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token using the same baseURL as the api instance
                await axios.post(
                    `${api.defaults.baseURL}/auth/refresh/`,
                    {},
                    { withCredentials: true }
                );
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
