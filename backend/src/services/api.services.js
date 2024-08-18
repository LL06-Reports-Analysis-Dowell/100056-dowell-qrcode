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

const getUserAPIKey = async (workspaceId) =>{
    const response = await axios.get(`https://100105.pythonanywhere.com/api/v3/user/?type=get_api_key&workspace_id=${workspaceId}`);
    
    if (!response.data.success) {
        return {
            success: false,
            message: 'Failed to get api key for workspace ',
        }
    }
    return {
        success: true,
        message: 'Workspace ID fetched successfully',
        apiKey: response.data.data.api_key
    };
}

const dowellLoginService = async (portfolioName,password,workspaceName) => {
    const response = await axios.post("https://100093.pythonanywhere.com/api/portfoliologin", {
        portfolio: portfolioName,
        password: password,
        workspace_name: workspaceName,
        username: "false"
    });

    if (!response.data.userinfo.workspace_name == workspaceName) {
        return {
            success: false,
            message: 'Invalid portfolio or password' || response?.data?.message,
        }
    }

    return {
        success: true,
        message: 'Login successful',
        userinfo: response.data
    };
}
export {
    updaloadQrcodeImage,
    getUserAPIKey,
    dowellLoginService
}