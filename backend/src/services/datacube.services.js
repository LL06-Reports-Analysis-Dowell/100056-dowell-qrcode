import axios from 'axios';

class Datacubeservices {
    constructor(apiKey) {
        this.apiKey = apiKey;
        // this.baseUrl = 'https://datacube.uxlivinglab.online/db_api';
        this.baseUrl = 'https://www.dowelldatacube.uxlivinglab.online/db_api';
    }

    async dataInsertion(databaseName, collectionName, data) {
        const url = `${this.baseUrl}/crud/`;
        const payload = {
            api_key: this.apiKey,
            db_name: databaseName,
            coll_name: collectionName,
            operation: 'insert',
            data: data,
            payment: false
        };
        try {
            const response = await axios.post(url, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async dataRetrieval(databaseName, collectionName, filters, limit, offset) {
        const url = `${this.baseUrl}/get_data/`;
        const payload = {
            api_key: this.apiKey,
            db_name: databaseName,
            coll_name: collectionName,
            operation: 'fetch',
            filters: filters,
            limit: limit,
            offset: offset,
            payment: false
        };
        try {
            const response = await axios.post(url, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async dataUpdate(databaseName, collectionName, query, updateData) {
        const url = `${this.baseUrl}/crud/`;
        const payload = {
            api_key: this.apiKey,
            db_name: databaseName,
            coll_name: collectionName,
            operation: 'update',
            query: query,
            update_data: updateData,
            payment: false
        };
        try {
            const response = await axios.put(url, payload);
            return {
                success: true,
                message: "Data updated successfully",
                response: response.data
            }
        } catch (error) {
            return {
                success: false,
                message: "Error updating data",
                error: error.message
            };
        }
    }

    async createCollection(databaseName, collectionName) {
        const url = `${this.baseUrl}/add_collection/`;
        const payload = {
            api_key: this.apiKey,
            db_name: databaseName,
            coll_names: collectionName,
            num_collections: 1
        };
        try {
            const response = await axios.post(url, payload);
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Error retrieving collections",
                error: error.message
            };
        }
    }

    async collectionRetrieval(databaseName) {
        const url = `${this.baseUrl}/collections/`;
        const payload = {
            api_key: this.apiKey,
            db_name: databaseName,
            payment: false
        };
    
        try {
            const response = await axios({
                method: 'get',
                url: url,
                data: payload,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            return {
                success: false,
                message: "Error retrieving collections",
                error: error.message
            };
        }
    }
    

    async dataDelete(databaseName, collectionName, query) {
        const url = `${this.baseUrl}/crud/`;
        const payload = {
            api_key: this.apiKey,
            db_name: databaseName,
            coll_name: collectionName,
            operation: 'delete',
            query: query
        };
        try {
            const response = await axios.delete(url, { data: payload });
            return response.data;
        } catch (error) {
            console.error('Error in dataDelete:', error);
            throw error;
        }
    }
}

export default Datacubeservices;