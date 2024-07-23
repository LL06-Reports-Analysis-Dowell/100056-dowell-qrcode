import { Worker } from 'bullmq';
import config from './index.js';
import { insertData, updateData } from '../utils/database.helper.js';
import Datacubeservices from '../services/datacube.services.js';
import LinkQrcode from "../models/linkqrcode.schema.js";


const saveMongoDbWorker = new Worker(
    "insert-data-to-mongodb",
    async (job) => {
        const success = await insertData(job.data);
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
    'save-stats-to-datacube',
    async (job) => {
        const { qrcodeId, latitude, longitude, scannedAt } = job.data;
        const datacube = new Datacubeservices("1b834e07-c68b-4bf6-96dd-ab7cdc62f07f");
        let workspaceId;

        try {
            if (qrcodeId.split("-")[0] === '11') {
                const masterQrcodeResponse = await LinkQrcode.findOne({ masterQrcodeId: qrcodeId });
                if (masterQrcodeResponse) {
                    workspaceId = masterQrcodeResponse.workspaceId;
                } else {
                    throw new Error("Master QR code not found");
                }
            } else {
                const childQrcodeResponse = await LinkQrcode.findOne({ childQrcodeId: qrcodeId });
                if (childQrcodeResponse) {
                    workspaceId = childQrcodeResponse.workspaceId;
                } else {
                    throw new Error("Child QR code not found");
                }
            }

            if (!workspaceId) {
                throw new Error("Workspace ID not found");
            }

            const data = {
                qrcodeId,
                latitude,
                longitude,
                workspaceId,
                scannedAt,
                records: [{ record: "1", type: "overall" }]
            };

            const success = await datacube.dataInsertion(
                `${workspaceId}_qrcode_database`,
                `${workspaceId}_qrcode_stat_collection`,
                data
            );

            if (!success) {
                throw new Error(`Failed to save stats for workspaceId: ${workspaceId}`);
            }

            return { success: true, message: "Stats have been saved successfully in Datacube" };

        } catch (error) {
            console.error(`Error processing job ${job.id}:`, error.message);
            return { success: false, message: error.message };
        }
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
