import { MongoClient } from "mongodb";
import Redis from "ioredis";

const mongoUri = process.env.MONGO_URI;
const redisHost = process.env.REDIS_HOST;

const redis = new Redis({ host: redisHost, port: 6379, password: process.env.REDIS_PASSWORD });

let mongoClient;
let dbInstance;

export async function connectToMongo(dbName) {
  if (dbInstance) return dbInstance; // ✅ return existing connection

  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await mongoClient.connect();
    console.log("✅ Connected to MongoDB");
  }

  dbInstance = mongoClient.db(dbName); 
  return dbInstance;
}

export { redis };