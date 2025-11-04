import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { checkDistanceForQrcodeURL } from './constant.js';
import jwt from "jsonwebtoken";


function generateFileName() {
    const timestamp = Date.now();
    const filename = `qrcode_${timestamp}.png`;
    return filename;
}


const createUUID = (qrType) => {
    const uniqueId = uuidv4();
    if (qrType === 'masterQrcode') {
        return `11-${uniqueId}`;
    } else if (qrType === 'childQrcode') {
        return `22-${uniqueId}`;
    } else {
        throw new Error("Invalid type. Allowed types are 'master_qrcode' and 'child_qrcode'.");
    }
};

const calculateDateRange = (range) => {
    const endDate = new Date();
    let startDate;

    switch (range) {
        case '7days':
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            break;
        case '30days':
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);
            break;
        case '90days':
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 90);
            break;
        case '365days':
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 365);
            break;
        default:
            throw new Error('Invalid date range');
    }

    return { startDate, endDate };
};


const checkQrcodeDistance = async (radius,referencePoint,locations) => {

    const response = await axios.post(checkDistanceForQrcodeURL,{
        radius,
        reference_point: referencePoint,
        locations
    });
    if (!response.data.success) {
        return {
            success: false,
            message: 'Failed to check distance for QR codes',
            error: response.data
        }
    }
    return {
        success: true,
        message: 'Distance checked successfully',
        response: response.data.results,
    }
}

const createJWTToken = (collectionName, name, exhibitorId, endDateStr) => {
    const endDate = new Date(endDateStr);
    console.log(`End date str: ${endDateStr}, type: ${typeof endDate}, end date:`, endDate);
    const timeSpan = Math.floor((endDate - Date.now()) / 1000);
    console.log(`Expiry time for JWT: ${timeSpan} seconds`);
    const payload = {
    collectionName: collectionName,
    name: name,
    exhibitorId: exhibitorId
    };

    const secretKey = process.env.JWT_SECRET

    const token = jwt.sign(payload, secretKey, {
    algorithm: "HS256",
    expiresIn: `${timeSpan}s`
    });

    return token;
}

const JWTDecode = (token) => {
    try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Original payload:", decoded);
    return decoded;
    } catch (error) {
    console.error("❌ Invalid or expired token:", error.message);
    }
}

export {
    generateFileName,
    createUUID,
    calculateDateRange,
    checkQrcodeDistance,
    createJWTToken,
    JWTDecode
};
