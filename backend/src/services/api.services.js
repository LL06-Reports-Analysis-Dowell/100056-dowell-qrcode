import axios from "axios";

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

const getWorkSpaceId = async (apiKey) =>{
    const response = await axios.get(`https://100105.pythonanywhere.com/api/v3/user/?type=get_api_key&api_key=${apiKey}`);
    
    if (!response.data.success) {
        return {
            success: false,
            message: 'Failed to get workspace ID',
        }
    }
    return {
        success: true,
        message: 'Workspace ID fetched successfully',
        workspaceId: response.data.data.workspaceId
    };
}

export {
    updaloadQrcodeImage,
    getWorkSpaceId
}