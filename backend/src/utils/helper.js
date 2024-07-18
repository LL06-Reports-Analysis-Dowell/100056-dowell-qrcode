import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';


const updaloadQrcodeImage = async (imgData, imgName = null) => {
    const url = 'https://dowellfileuploader.uxlivinglab.online/uploadfiles/upload-qrcode-to-drive/';
    try {
        const formData = new FormData();
        const blob = new Blob([imgData], { type: 'image/png' });
        formData.append('file', blob, imgName || 'qrcode.png');

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const fileUrl = response.data.file_url;
        return fileUrl;
    } catch (error) {
        if (error.response) {
            console.error('Server responded with non-success status:', error.response.status);
        } else if (error.request) {
            console.error('No response received from server:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
};

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
    updaloadQrcodeImage,
    generateFileName,
    createUUID
};
