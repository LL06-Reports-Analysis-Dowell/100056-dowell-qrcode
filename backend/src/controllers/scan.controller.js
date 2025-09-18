import { sendToKafka } from "../services/kafka.services.js";

export async function batchScans(req, res) {
    const { scans } = req.body;

    try {
        for (const scan of scans) {
            await sendToKafka(scan);
        }
        res.status(200).json({ success: true, count: scans.length });
    } catch (err) {
        console.error("❌ Failed to send scans to Kafka", err);
        res.status(500).json({ error: "Failed to send scans" });
    }
}
