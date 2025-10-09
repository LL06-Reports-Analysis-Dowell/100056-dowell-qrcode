import { MongoClient } from 'mongodb';
import kafka from './kafka-client.js';
import 'dotenv/config';
// Environment variables from Docker Compose
const mongoUri = process.env.MONGO_URI;
const topic = process.env.KAFKA_TOPIC;
const groupId = process.env.KAFKA_GROUP_ID;
const dbName = process.env.MONGO_DB_NAME || "qr_scans";
const collectionName = process.env.MONGO_COLLECTION || 'exhibitor1'; // The collection to store feedback
const exhibitorCollection = process.env.MONGO_EXHIBITOR_COLL || 'exhibitors';

const mongoClient = new MongoClient(mongoUri);
const consumer = kafka.consumer({ groupId: groupId });

/**
 * Main function to run the consumer worker.
 */
const run = async () => {
    // Connect to MongoDB
    await mongoClient.connect();
    console.log('Connected successfully to MongoDB');
    // The database name is part of the connection URI
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);
    console.log(`Targeting collection: ${collection.namespace}`);

    // Connect and subscribe the Kafka consumer
    await consumer.connect();
    console.log('Kafka Consumer connected.');
    console.log("KAFKA_TOPIC;", process.env.KAFKA_TOPIC);
    await consumer.subscribe({ topic: topic, fromBeginning: true });
    console.log(`Subscribed to Kafka topic: ${topic} with group ID: ${groupId}`);

    // Start consuming messages
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const feedbackEvent = JSON.parse(message.value.toString());
                console.log(`Received message from partition ${partition}:`, feedbackEvent);

                const documentToInsert = {
                    ...feedbackEvent,
                    processedAt: new Date(),
                    kafkaMetadata: {
                        topic,
                        partition,
                        offset: message.offset.toString(), // Store offset as string for compatibility
                    }
                };

                const result = await collection.insertOne(documentToInsert);
                console.log(`Successfully inserted feedback with _id: ${result.insertedId}`);
            } catch (err) {
                console.error('Error processing message or inserting into MongoDB:', err);
            }
        },
    });
};

run().catch(async (error) => {
    console.error('An error occurred in the consumer worker:', error);
    await shutdown();
    process.exit(1);
});

// Graceful shutdown logic
const shutdown = async () => {
    console.log('Shutting down consumer worker...');
    try {
        await consumer.disconnect();
        console.log('Kafka Consumer disconnected.');
    } catch (e) {
        console.error('Error disconnecting Kafka consumer', e);
    }
    try {
        await mongoClient.close();
        console.log('MongoDB connection closed.');
    } catch (e) {
        console.error('Error closing MongoDB connection', e);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
