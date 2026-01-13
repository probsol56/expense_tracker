import axios from 'axios';
import queryString from 'query-string';
import type { DataProvider } from 'react-admin';

const DATA_PROVIDER_API = import.meta.env.VITE_REACT_ADMIN_PROVIDER_API;

export const sendPost = async (resource: string, method: string, body?: never) => {
    const response = await axios({
        method: 'post',
        url: `${DATA_PROVIDER_API}/ra/${resource}${method}`,
        withCredentials: true,
        data: body,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('access_token')}`
        }
    })

    return response.data
}

export const dataProvider: DataProvider = {
    getList: (resource: string, params: any) => {
        const { page, perPage } = params.pagination
        const { field, order } = params.sort

        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify(params.filter),
        }
        return sendPost(resource, `/getList?${queryString.stringify(query)}`)
    },

    getOne: async (resource: string, params: any) => {
        if (params.id) {
            return await sendPost(resource, '/getOne/' + params.id)
        } else {
            return null;
        }
    },

    getMany: (resource: string, params: any) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        }

        return sendPost(resource, `/getMany?${queryString.stringify(query)}`)
    },

    getManyReference: async (resource: any, params: any): Promise<any> => {
        // console.log("params>>>", resource, params);
        const target = params.target
        const id = params.id
        const { page, perPage } = params.pagination
        const { field, order } = params.sort

        const query = {
            target: target,
            id: id,
            sort: JSON.stringify([field, order]),
            range_: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify(params.filter),
        }

        const result = await sendPost(resource, `/getList?${queryString.stringify(query)}`)
        result.data = result.data.map((item: any) => ({ ...item, id: item.id || item.uuid }))
        return result
    },

    create: async (resource: string, params: any) => {
        return await sendPost(resource, '/create', {
            ...params.data
        })
    },

    update: async (resource: string, params: any) => {
        return await sendPost(resource, '/update/' + params.id, params.data)
    },

    updateMany: async (resource: string, params: any) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        }

        return await sendPost(resource, `/updateMany?${queryString.stringify(query)}`, params.data)
    },

    delete: (resource: string, params: any) => {
        return sendPost(resource, '/delete/' + params.id)
    },

    deleteMany: (resource: string, params: any) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        }

        return sendPost(resource, `/deleteMany?${queryString.stringify(query)}`)
    },
}

// export default dataProvider;