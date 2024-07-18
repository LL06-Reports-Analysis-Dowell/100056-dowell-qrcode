import { Queue } from 'bullmq';
import config from './index.js';


const saveDataToMongoDB = new Queue('insert-data-to-mongodb', {
    connection: {
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword
    }
});

const mongoDbProducerServices = async (dataArray) => {
    try {
        const results = [];
        for (const data of dataArray) {
            const response = await saveDataToMongoDB.add('insert to mongodb database', data);
            console.log("Added data to queue", response.id);
            if (!response) {
                results.push({
                    success: false,
                    message: `Failed to produce data to MongoDB for item with childQrcodeId: ${data.childQrcodeId}`
                });
            } else {
                results.push({
                    success: true,
                    message: `Data produced to MongoDB successfully for item with childQrcodeId: ${data.childQrcodeId}`
                });
            }
        }
        return {
            success: true,
            message: 'All the data was successfully produced',
        };
    } catch (error) {
        return {
            success: false,
            message: `Error: ${error.message}`
        };
    }
};

export {
    mongoDbProducerServices
};
