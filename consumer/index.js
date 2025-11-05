import { MongoClient } from 'mongodb';
import kafka from './kafka-client.js';
import 'dotenv/config';
import Datacubeservices from './datacube.services.js';
import { v4 as uuidv4 } from 'uuid';
import { connectToMongo, closeMongo } from './db.js';
import { getTokenInfo } from './tokenCache.js';

// Environment variables from Docker Compose
const mongoUri = process.env.MONGO_URI;
const topic = process.env.KAFKA_TOPIC;
const groupId = process.env.KAFKA_GROUP_ID;
const dbName = process.env.MONGO_DB_NAME || "qr_scans";
// const collectionName = process.env.MONGO_COLLECTION || 'exhibitor1'; // The collection to store feedback
let collection;
let tokenCollection = false;
let tokenData = false;
let localScanCollection;
const exhibitorCollection = process.env.MONGO_EXHIBITOR_COLL || 'exhibitors';
const tokenCollectionName = process.env.MONGO_TOKEN_COLL || 'coll_tokens';

// const mongoClient = new MongoClient(mongoUri);
const db = await connectToMongo(dbName);
const consumer = kafka.consumer({ groupId: groupId });

const datacube = new Datacubeservices(process.env.DATACUBE_API_KEY);

/**
 * Main function to run the consumer worker.
 */
const run = async () => {
    // Connect to MongoDB
    // await mongoClient.connect();
    console.log('Connected successfully to MongoDB');
    // The database name is part of the connection URI
    // const db = mongoClient.db(dbName);
    

    // Connect and subscribe the Kafka consumer
    await consumer.connect();
    console.log('Kafka Consumer connected.');
    console.log("KAFKA_TOPIC;", process.env.KAFKA_TOPIC);
    await consumer.subscribe({ topic: topic, fromBeginning: false });
    console.log(`Subscribed to Kafka topic: ${topic} with group ID: ${groupId}`);

    // Start consuming messages
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const data = JSON.parse(message.value.toString());
                console.log(`Received message from partition ${partition}:`, data);
                if (data.dataType == 'exhibitor') {
                    // data.exhibitorId = uuidv4();
                    collection = db.collection(exhibitorCollection);
                    tokenCollection = db.collection(tokenCollectionName);
                    localScanCollection = db.collection(data.name+"_"+data.exhibitorId);
                    // create unique index once
                    await localScanCollection.createIndex({ data: 1 }, { unique: true });
                    tokenData = data.tokenDetails
                    delete data.tokenDetails;
                    console.log(`Targeting collection: ${collection.namespace}`);
                    console.log(`DataType = exhibitor,keys present in the data: ${Object.keys(data)}`);
                    
                    const collections =[{
                                name: data.name+"_"+data.exhibitorId,
                                fields: [ 
                                    {"name":"data","type":"string"},
                                    {"name":"timestamp","type":"string"}
                                ]
                        }]
                    const response  = await datacube.createCollection(process.env.DATABASE_ID,collections)
                    if (response.success) {
                        delete data.dataType;
                        const res = await datacube.dataInsertion(process.env.DATABASE_ID, exhibitorCollection, data);
                        const tokenRes = await datacube.dataInsertion(process.env.DATABASE_ID, tokenCollectionName, tokenData);
                        console.log("This is the exhibitor insertion response",res);
                        data.datacube_success = true; 
                        console.log('Collection created successfully in datacube:', response.message);
                    } else {
                        data.datacube_success = false;
                        console.error('Error creating collection:', response.error);
                    }
                }else{
                    const tokenId = data[0].tokenId
                    const tokenInfo = await getTokenInfo(tokenId)
                    console.log(`Token info: ${tokenInfo}`);
                    const collectionName = tokenInfo.collectionName
                    collection = db.collection(collectionName);
                    console.log(`Targeting collection: ${collection.namespace}`);
                    console.log(`DataType = scanner,keys present in the data: ${Object.keys(data)}`);
                    for (let i = 0; i < data.length; i++) {
                        console.log(data[i]);
                        delete data[i].tokenId
                        data[i].timestamp = new Date().toISOString();
                        const response = await datacube.dataInsertion(process.env.DATABASE_ID, collectionName, data[i]);
                        if (response.success) {
                            data[i].datacube_success = true; 
                            console.log('Scan inserted successfully in datacube:', response.message);
                        } else {
                            data[i].datacube_success = false;
                            console.error('Error inserting scan:', response.error);
                        }
                    }
                    
                }
                const documentToInsert = {
                    ...data,
                    processedAt: new Date(),
                    kafkaMetadata: {
                        topic,
                        partition,
                        offset: message.offset.toString(), // Store offset as string for compatibility
                    }
                };

                const result = await collection.insertOne(documentToInsert);
                console.log(`Successfully inserted data with _id: ${result.insertedId} in collection: ${collection.namespace}`);
                if (tokenCollection && tokenData) {
                    const tokenDocumentToInsert = {
                        ...tokenData,
                        processedAt: new Date(),
                        kafkaMetadata: {
                            topic,
                            partition,
                            offset: message.offset.toString(), // Store offset as string for compatibility
                        }
                    };
                    const tokenResult = await tokenCollection.insertOne(tokenDocumentToInsert);
                    console.log(`Successfully inserted token data with _id: ${tokenResult.insertedId} in collection: ${tokenCollection.namespace}`);
                }
            } catch (err) {
                if (err.code === 11000) {
                    console.log("Duplicate ignored:", err.keyValue);
                }
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
        await closeMongo();
        console.log('MongoDB connection closed.');
    } catch (e) {
        console.error('Error closing MongoDB connection', e);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
