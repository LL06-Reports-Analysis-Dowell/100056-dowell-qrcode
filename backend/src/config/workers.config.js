import { Worker } from 'bullmq';
import config from './index.js';
import { insertData,updateData } from '../utils/database.helper.js';

const saveMongoDbWorker = new Worker(
    "insert-data-to-mongodb",
    async (job) => {
        const workspaceId = job.data.workspaceId;
        const data = job.data;
        const success = await insertData(data, workspaceId);
        if (!success) {
            return success.data;
        }
        return "Data has been saved successfully to Datacube";
    },
    {
        connection: {
            host: config.redisHost,
            port: config.redisPort,
            password: config.redisPassword
        },
        timeout: 300000, 
        attempts: 5, 
        backoff: {
            type: 'exponential',
            delay: 10000
        }
    }
);

const updateDatacubeWorker = new Worker(
    "update-data-in-datacube",
    async (job) => {
        const workspaceId = job.data.workspaceId;
        const data = job.data;
        const success = await updateData(data, workspaceId);
        if (!success) {
            return {
                success: false,
                message: `Failed to update data for workspaceId: ${workspaceId}`
            };
        }
        return {
            success: true,
            message: "Data has been updated successfully in Datacube"
        };
    },
    {
        connection: {
            host: config.redisHost,
            port: config.redisPort,
            password: config.redisPassword
        },
        timeout: 300000, 
        attempts: 5, 
        backoff: {
            type: 'exponential',
            delay: 10000
        }
    }
);

export { saveMongoDbWorker, updateDatacubeWorker };

