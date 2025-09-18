import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "qr-app",
    brokers: ["kafka:9092"], // change to your Kafka broker(s)
});

const producer = kafka.producer();

export async function initKafka() {
    await producer.connect();
    console.log("✅ Kafka producer connected");
}

export async function sendToKafka(scan) {
    await producer.send({
        topic: "qr-scans",
        messages: [{ key: scan.id, value: JSON.stringify(scan) }],
    });
}
