import { Worker } from 'bullmq';
import config from './index.js';
import { insertData, updateData } from '../utils/database.helper.js';
import Datacubeservices from '../services/datacube.services.js';


const saveMongoDbWorker = new Worker(
    "insert-data-to-mongodb",
    async (job) => {
        const { workspaceId, ...data } = job.data;
        const success = await insertData(data, workspaceId);
        if (!success) {
            return {
                success: false,
                message: "Failed to insert data to MongoDB"
            };
        }
        return {
            success: true,
            message: "Data has been saved successfully to MongoDB"
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


const updateDatacubeWorker = new Worker(
    "update-data-in-datacube",
    async (job) => {
        const { workspaceId, ...data } = job.data;
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

const saveStatsWorker = new Worker(
    "save-stats-to-datacube",
    async (job) => {
        const { apiKey, qrcodeId, latitude, longitude, workspaceId } = job.data;
        const data = {
            qrcodeId,
            latitude,
            longitude,
            workspaceId,
            scannedAt: new Date().toISOString(),
            records: [{ record: "1", type: "overall" }]
        };

        const datacube = new Datacubeservices(apiKey);
        const success = await datacube.dataInsertion(
            `${workspaceId}_qrcode_database`,
            `${workspaceId}_qrcode_stat_collection`,
            data
        );
        
        if (!success) {
            return {
                success: false,
                message: `Failed to save stats for workspaceId: ${workspaceId}`
            };
        }
        
        return {
            success: true,
            message: "Stats have been saved successfully in Datacube"
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

export { saveMongoDbWorker, updateDatacubeWorker, saveStatsWorker };
