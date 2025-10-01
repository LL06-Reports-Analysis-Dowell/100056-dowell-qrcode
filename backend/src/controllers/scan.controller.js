import kafka  from "../services/updateKafka.services.js";
async function sendtoKafka(data) {
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
            topic: process.env.KAFKA_TOPIC,
            messages: [{
                "key": "scanID001",
                "value": JSON.stringify({"name":"Exhibitor1","scans":"scans"})
            }],
               
        });

}

export async function batchScans(req, res) {
    const { scans } = req.body;
    console.log("This is the topic:",process.env.KAFKA_TOPIC)
    try {
            await sendtoKafka(scans);
        
        res.status(200).json({ success: true, count: scans.length });
    } catch (err) {
        console.error("❌ Failed to send scans to Kafka", err);
        res.status(500).json({ error: "Failed to send scans" });
    }
}
