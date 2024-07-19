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


export {
    generateFileName,
    createUUID
};
