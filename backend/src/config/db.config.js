import mongoose from "mongoose";
import config from "./index.js";
export const connectToDb = async (connType='otp') => {
    try {
        if (connType == 'scanner'){
            // if (!scannerConnection) {
                const scannerUri = process.env.MONGO_SCAN_URI+"/"+process.env.MONGO_DB_NAME+"?authSource=admin"
                const scannerConnection = mongoose.createConnection(scannerUri);
                scannerConnection.on("connected", () => console.log("✅ Connected to scanner DB"));
                scannerConnection.on("error", (err) => console.error("❌ Scanner DB error:", err));
            // }
            return scannerConnection
        } else{
            // if (!otpConnection) {
                const otpConnection = mongoose.createConnection(process.env.MONGO_DB_URI);
                otpConnection.on("connected", () => console.log("✅ Connected to OTP DB"));
                otpConnection.on("error", (err) => console.error("❌ OTP DB error:", err));
            // }
            return otpConnection
        }
        
        // await mongoose.connect(config.MONGO_DB_URI);
        // console.log('Connected to DB')
    } catch (error) {
        console.log('Failed to connect to any DB: ', error);
    }
}