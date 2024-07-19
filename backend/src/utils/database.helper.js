import Datacubeservices from '../services/datacube.services.js';

const insertData = async (data, workspaceId) => {
    const datacube = new Datacubeservices("1b834e07-c68b-4bf6-96dd-ab7cdc62f07f");
    
    try {
        const response = await datacube.dataInsertion(
            `${workspaceId}_qrcode_database`,
            `${workspaceId}_child_qrcode_list_collection`,
            data
        );

        console.log(response.data);

        if (!response.success) {
            console.log("all failed");
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};

const updateData = async (data, workspaceId) => {
    const datacube = new Datacubeservices("1b834e07-c68b-4bf6-96dd-ab7cdc62f07f");

    try {
        const response = await datacube.dataUpdate(
            `${workspaceId}_qrcode_database`,
            `${workspaceId}_child_qrcode_list_collection`,
            { childQrcodeId: data.childQrcodeId },
            { 
                latitude: data.latitude,
                longitude: data.longitude,
                isActive: data.isActive,
                location: data.location,
                fieldsData: data.fieldsData,
             }
        );

        if (!response.success) {
            console.log("all failed");
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
};
export {
    insertData,
    updateData
};
