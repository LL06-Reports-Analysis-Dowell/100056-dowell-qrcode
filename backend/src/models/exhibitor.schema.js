import mongoose from "mongoose";
import { connectToDb } from "../config/db.config.js";

const exhibitorSchema = new mongoose.Schema({
    exhibitorId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    isActive:{
        type: Boolean,
        default: false
    }
});

const scannerDb = await connectToDb("scanner");

export default scannerDb.model('Exhibitors', exhibitorSchema);
