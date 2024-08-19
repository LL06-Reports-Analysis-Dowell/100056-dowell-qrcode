import dotenv from 'dotenv';

dotenv.config();

const config = {
    PORT: process.env.PORT || 5000,
    MONGO_DB_URI: process.env.MONGO_DB_URI || "mongodb://mongo:27017/dowellqrcodegenerator",
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "q1e2r3s4",
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    JWT_EXPIRY: process.env.JWT_EXPIRY || "7d",
    JWT_SECRET: process.env.JWT_SECRET || "Q1E2r3S4",
    redisHost: process.env.REDIS_HOST || 'cache',
    redisPort: process.env.REDIS_PORT || 6379,
    redisPassword: process.env.REDIS_PASSWORD || 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81'
};



export default config;

