import type { DataProvider } from 'react-admin';
import axios from 'axios';
import queryString from 'query-string';

const apiUrl = import.meta.env.VITE_REACT_ADMIN_PROVIDER_API;

export const axiosInstance = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
    }
});

axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const dataProvider: DataProvider = {
    getList: async (resource, params) => {
        const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
        const query = {
            page: page,
            pageSize: perPage,
        };
        const url = `/${resource}?${queryString.stringify(query)}`;
        const { data } = await axiosInstance.get(url);

        // Backend returns { categories: [...], totalCount: ... }
        // We handle dynamic keys
        const items = data.categories || data.transactions || data.items || [];
        const total = data.totalCount || items.length;

        return {
            data: items,
            total: total,
        };
    },

    getOne: async (resource, params) => {
        const url = `/${resource}/${params.id}`;
        const { data } = await axiosInstance.get(url);
        return { data: data };
    },

    getMany: async (resource, params) => {
        const query = {
            ids: params.ids,
        }
        const url = `/${resource}?${queryString.stringify(query)}`;
        const { data } = await axiosInstance.get(url);
        return { data: data };
    },

    getManyReference: async (resource, params) => {
        const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
        const query = {
            page: page,
            pageSize: perPage,
            [params.target]: params.id,
        };
        const url = `/${resource}?${queryString.stringify(query)}`;
        const { data } = await axiosInstance.get(url);

        const items = data.categories || data.transactions || [];
        const total = data.totalCount || items.length;

        return {
            data: items,
            total: total,
        };
    },

    update: async (resource, params) => {
        const url = `/${resource}/${params.id}`;
        const { data } = await axiosInstance.put(url, params.data);
        return { data: data };
    },

    updateMany: async (resource, params) => {
        await Promise.all(
            params.ids.map(id =>
                axiosInstance.put(`/${resource}/${id}`, params.data)
            )
        );
        return { data: params.ids };
    },

    create: async (resource, params) => {
        const url = `/${resource}`;
        const { data } = await axiosInstance.post(url, params.data);
        return { data: data };
    },

    delete: async (resource, params) => {
        const url = `/${resource}/${params.id}`;
        const { data } = await axiosInstance.delete(url);
        return { data: data };
    },

    deleteMany: async (resource, params) => {
        await Promise.all(
            params.ids.map(id =>
                axiosInstance.delete(`/${resource}/${id}`)
            )
        );
        return { data: params.ids };
    },
};