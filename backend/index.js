import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './src/routes/index.js';
import { connectToDb } from './src/config/db.config.js';
import config from './src/config/index.js';
import { saveMongoDbWorker, updateDatacubeWorker, saveStatsWorker, updateChildQrCodeActivationStatusWorker } from './src/config/workers.config.js';
import { initKafka } from "./src/services/kafka.services.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
const app = express();

const allowedOrigins = [
    'http://backend:5000',  // For local development on your machine
    'http://localhost:8080',
    // Add other potential development origins if needed
    'http://127.0.0.1:8080'
];

const corsOptions = {
  // Use a function to check the origin dynamically
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true); 
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // You can return an error if the origin is not allowed
      callback(new Error('Not allowed by CORS')); 
    }
  },
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies and authentication headers (if needed)
};

// Apply CORS middleware
app.use(cors(corsOptions)); // <--- APPLY CORS BEFORE ROUTES

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
// Error handler
app.use(errorHandler);
app.use('/api/v1/', routes);

app.get('/', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Backend services are running fine'
    });
});

app.get('/:productName/:id', (req, res) => {
    const { productName } = req.params;
    res.redirect(`https://ll06-reports-analysis-dowell.github.io/qrcode-scanner/?productName=${productName}`);
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
    initializeWorker(updateChildQrCodeActivationStatusWorker, 'updateChildQrCodeActivationStatusWorker');

    async () => {
        await initKafka();
    }
    app.listen(config.PORT, onListening);
}).catch((error) => {
    console.error('Failed to connect to DB:', error);
});
