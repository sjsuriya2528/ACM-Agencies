import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

let loaderHandler = {
    show: () => { },
    hide: () => { }
};

export const setLoaderHandler = (handler) => {
    loaderHandler = handler;
};

api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('adminUser');
        if (user) {
            const { token } = JSON.parse(user);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Trigger loader
        const loadingTerm = config.headers['x-loading-term'] || 'Processing';
        loaderHandler.show(`${loadingTerm}...`);
        delete config.headers['x-loading-term']; // Remove custom header before sending

        return config;
    },
    (error) => {
        loaderHandler.hide();
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        loaderHandler.hide();
        return response;
    },
    (error) => {
        loaderHandler.hide();
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized request detected. Redirecting to login...');
            localStorage.removeItem('adminUser');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
