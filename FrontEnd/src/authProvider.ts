import type { AuthProvider } from 'react-admin';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_REACT_ADMIN_PROVIDER_API;

export const authProvider: AuthProvider = {
    login: async ({ username, password }) => {
        try {
            const response = await axios.post(`${apiUrl}/authentication/login`, { username, password });
            const { token } = response.data;
            localStorage.setItem('access_token', token);
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    },
    logout: () => {
        localStorage.removeItem('access_token');
        return Promise.resolve();
    },
    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('access_token');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    checkAuth: () => {
        return localStorage.getItem('access_token') ? Promise.resolve() : Promise.reject();
    },
    getPermissions: () => Promise.resolve(),
};
