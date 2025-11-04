import mongoose from "mongoose";
import { connectToDb } from "../config/db.config.js";

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    tokenId: {
        type: String,
        required: true,
        unique: true
    }
});

const tokenDb = await connectToDb("scanner");

export default tokenDb.model('TokenSchema', tokenSchema, 'coll_tokens');