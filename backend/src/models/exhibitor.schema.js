import mongoose from "mongoose";
import { connectToDb } from "../config/db.config.js";

const exhibitorSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
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
    location: {
        type: String,
        default: ''
    },
    createdAt: {
        type: String,
        default: ''
    },
    updatedAt: {
        type: String,
        required: true
    },
    status:{
        type: String,
        default: false
    }
});

const scannerDb = await connectToDb("scanner");

export default scannerDb.model('ExhibitorSchema', exhibitorSchema);
