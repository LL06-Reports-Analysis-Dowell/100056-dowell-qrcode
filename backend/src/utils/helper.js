import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';


function generateFileName() {
    const timestamp = Math.floor(Date.now() / 1000); // Using Unix timestamp in seconds
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


export {
    generateFileName,
    createUUID,
    calculateDateRange
};
