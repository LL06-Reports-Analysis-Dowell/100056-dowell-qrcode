import kafka  from "../services/updateKafka.services.js";
import { v4 as uuidv4 } from "uuid";
import Datacubeservices from '../services/datacube.services.js';
import ExhibitorSchema from "../models/exhibitor.schema.js";
import TokenSchema from "../models/token.schema.js";
import { createJWTToken, JWTDecode } from "../utils/helper.js";

const datacube = new Datacubeservices(process.env.DATACUBE_API_KEY);
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
    // let { exhibitor } = req.body;
    console.log("This is the body:", req.body)
    const domainName = req.body.domainName;
    delete req.body.domainName;
    const tokenId = uuidv4();
    const exhibitorId = uuidv4();
    const token = createJWTToken(req.body.name+"_"+exhibitorId, req.body.name, exhibitorId, req.body.endDate);
    const url = `${domainName}/scan-link-pro/?token=${tokenId}`

    let exhibitor = { ...req.body, 
        dataType: "exhibitor",
        exhibitorId: exhibitorId,
        url: url,
        tokenDetails: { 
            token: token, 
            tokenId: tokenId 
        }};
    console.log(`This is the exhibitor:${exhibitor}, type:${typeof exhibitor}`)
    // exhibitor.dataType = "exhibitor";
    console.log("This is the topic:",process.env.KAFKA_TOPIC)
    try {
            await sendtoKafka(exhibitor);
        
        res.status(200).json({ success: true, count: exhibitor.length, url: url });
    } catch (err) {
        console.error("❌ Failed to send exhibitor to Kafka", err);
        res.status(500).json({ error: "Failed to send exhibitor" });
    }
}

export async function getExhibitors(req, res) {
    const databaseId = process.env.DATABASE_ID;
    console.log(`Database ID: ${databaseId}`);
    const collectionName = process.env.MONGO_EXHIBITOR_COLL;

    try {
        const fil = req.query.filters;
        console.log(`Filters: ${fil}`);
        const results = await datacube.dataRetrieval(databaseId, collectionName, fil)
        if (results.success){
            res.status(200).json({ success: true, data: results.data, message: "Datacube data" });
        }else {
            const mongoResults = await ExhibitorSchema.find({});
            res.status(200).json({ success: true, data: mongoResults, message: "Mongo Data"});
        }
        
    } catch (err) {
        console.error("❌ Failed to get exhibitors", err);
        res.status(500).json({ error: "Failed to get exhibitors" });
    }
}

export async function validateToken(req, res) {
    const tokenId = req.body.tokenId;
    
    try {
        const exists = await TokenSchema.exists({ tokenId: tokenId });
        if (exists){
            const tokenData = await TokenSchema.findOne({ tokenId: tokenId });
            const decoded = JWTDecode(tokenData.token);
            const exhibitorData = await ExhibitorSchema.findOne({ exhibitorId: decoded.exhibitorId });
            console.log(`This is the exhibitor data: ${exhibitorData}`);

            res.status(200).json({ success: true, isValid: true, isActive: exhibitorData.isActive, message: "Token exists in MongoDB" });  
        }else {
            res.status(200).json({ success: true, isValid: false, isActive: false, message: "Token does not exist in MongoDB" });
        }
    }catch (err) {
        console.error("❌ Failed to validate token", err);
        res.status(500).json({ error: "Failed to validate token" });
    }
}