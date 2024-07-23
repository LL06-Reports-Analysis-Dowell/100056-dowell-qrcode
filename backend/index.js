import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './src/routes/index.js';
import { connectToDb } from './src/config/db.config.js';
import config from './src/config/index.js';
import { saveMongoDbWorker, updateDatacubeWorker, saveStatsWorker } from './src/config/workers.config.js';

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

app.get('/:id', (req, res) => {
    res.redirect('https://ll06-reports-analysis-dowell.github.io/qrcode-scanner/');
});

app.get('/health', (req, res) => {
    return res.status(200).json({ 
        success: true,
        message: 'API services are running fine' 
    });
})

app.all('*', (_req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const onListening = () => {
    console.log(`Listening on port ${config.PORT}`);
};

const initializeWorker = (worker, name) => {
    worker.on('completed', (job) => {
        console.log(`Job ${name} completed with result: ${job.returnvalue}`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${name} ${job.id} failed with error: ${err.message}`);
    });

    worker
        .waitUntilReady()
        .then(() => {
            console.log(`${name} started successfully`);
        })
        .catch((error) => {
            console.error(`Failed to start ${name}:`, error);
        });
};

connectToDb().then(() => {
    initializeWorker(saveMongoDbWorker, 'saveMongoDbWorker');
    initializeWorker(updateDatacubeWorker, 'updateDatacubeWorker');
    initializeWorker(saveStatsWorker, 'saveStatsWorker');

    app.listen(config.PORT, onListening);
}).catch((error) => {
    console.error('Failed to connect to DB:', error);
});
