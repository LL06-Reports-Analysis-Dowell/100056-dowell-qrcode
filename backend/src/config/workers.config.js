import { Worker } from 'bullmq';
import config from './index.js';
import { insertData } from '../utils/database.helper.js';

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

export { saveMongoDbWorker };

