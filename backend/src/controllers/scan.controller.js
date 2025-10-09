import kafka  from "../services/updateKafka.services.js";
import { v4 as uuidv4 } from "uuid";
import Datacubeservices from '../services/datacube.services.js';
import ExhibitorSchema from "../models/exhibitor.schema.js";
async function sendtoKafka(data) {
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
            topic: process.env.KAFKA_TOPIC,
            messages: [{
                "key": uuidv4(),
                // "value": JSON.stringify({"name":"Exhibitor1","scans":"scans"})
                "value": JSON.stringify(data)
            }],
               
        });

}

export async function batchScans(req, res) {
    let { scans } = req.body;
    scans.dataType = "scan"
    console.log("This is the topic:",process.env.KAFKA_TOPIC)
    try {
            await sendtoKafka(scans);
        
        res.status(200).json({ success: true, count: scans.length });
    } catch (err) {
        console.error("❌ Failed to send scans to Kafka", err);
        res.status(500).json({ error: "Failed to send scans" });
    }
}


export async function createExhibitor(req, res) {
    let { exhibitor } = req.body;
    exhibitor.dataType = "exhibitor";
    console.log("This is the topic:",process.env.KAFKA_TOPIC)
    try {
            await sendtoKafka(exhibitor);
        
        res.status(200).json({ success: true, count: exhibitor.length });
    } catch (err) {
        console.error("❌ Failed to send scans to Kafka", err);
        res.status(500).json({ error: "Failed to send scans" });
    }
}

export async function getExhibitors(req, res) {
    const databaseId = process.env.DATABASE_ID;
    const collectionName = process.env.MONGO_EXHIBITOR_COLL;

    try {
        const results = await Datacubeservices.dataRetrieval(databaseId, collectionName, filters={})
        if (results.success){
            res.status(200).json({ success: true, data: results.data });
        }else {
            const mongoResults = await ExhibitorSchema.find({});
            res.status(200).json({ success: true, data: mongoResults });
        }
        
    } catch (err) {
        console.error("❌ Failed to send scans to Kafka", err);
        res.status(500).json({ error: "Failed to send scans" });
    }
}
