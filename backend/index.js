
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './src/routes/index.js';
import { connectToDb } from './src/config/db.config.js';
import config from './src/config/index.js';
import { saveMongoDbWorker } from './src/config/workers.config.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.use('/api/v1/', routes);

app.get('/', (req, res) => {
    return res.status(200).json({ 
        success: true,
        message: 'Backend services are running fine' 
    });
});

app.all('*', (_req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const onListening = () => {
    console.log(`Listening on port ${config.PORT}`);
};

connectToDb().then(() => {
    saveMongoDbWorker.on('completed', (job) => {
        console.log(`Job completed with result: ${job.returnvalue}`);
    });

    saveMongoDbWorker.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed with error: ${err.message}`);
    });

    saveMongoDbWorker
        .waitUntilReady()
        .then(() => {
            console.log('Worker started successfully');
            app.listen(config.PORT, onListening);
        })
        .catch((error) => {
            console.error('Failed to start worker:', error);
        });
}).catch((error) => {
    console.error('Failed to connect to DB:', error);
});
