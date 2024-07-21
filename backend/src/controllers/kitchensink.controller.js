import { asyncHandler } from "../utils/asyncHandler.js";
import PayloadValidationServices from "../services/validation.services.js";
import Datacubeservices from '../services/datacube.services.js';
import { createCollectionSchema } from '../utils/payloadSchema.js';
import User from '../models/auth.schema.js';


const createCollection = asyncHandler(async (req,res)=>{
    const { workspaceId, collectionName } = req.body;

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    const validatePayload = PayloadValidationServices.validateData(createCollectionSchema, {
        workspaceId : workspaceId,
        collectionName : collectionName
    });
    
    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const datacube = new Datacubeservices(apiKey.split(' ')[1]);

    const response = await datacube.createCollection(
        `{workspaceId}_qrcode_database`,
        collectionName
    )

    if(!response.success){
        return res.status(500).json({
            success: false,
            message: "Falied to create collection, kindly contact the administrator",
            response: response.data
        });
    }

});

const checkDatabaseStatus = asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;

    if (!workspaceId) {
        return res.status(400).json({
            success: false,
            message: "Workspace ID is required",
        });
    }

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    const datacube = new Datacubeservices(apiKey.split(' ')[1]);

    const response = await datacube.collectionRetrieval(`${workspaceId}_qrcode_database`);


    if (!response.success) {
        return res.status(501).json({
            success: false,
            message: "Database is not yet ready, kindly contact the administrator",
            response: {
                databaseName: `${workspaceId}_qrcode_database`,
                collectionNames: [
                    `${workspaceId}_child_qrcode_list_collection`,
                    `${workspaceId}_master_qrcode_list_collection`,
                    `${workspaceId}_qrcode_stat_collection`
                ]
            }
        });
    }

    const updateUserData = await User.findOneAndUpdate(
        { workspaceId },
        {
            $set: {
                isDatabaseReady: true
            }
        },
        { new: true }
    )

    if(!updateUserData){
        return res.status(500).json({
            success: false,
            message: "Failed to update user database status"
        });
    }

    const listOfMetaDataCollection = [
        `${workspaceId}_child_qrcode_list_collection`,
        `${workspaceId}_master_qrcode_list_collection`,
        `${workspaceId}_qrcode_stat_collection`
    ];

    console.log("Expected collections:", listOfMetaDataCollection);
    console.log("Response data:", response.data[0]);

    const missingCollections = listOfMetaDataCollection.filter(collection =>
        !response.data[0].includes(collection)
    );

    if (missingCollections.length > 0) {
        const missingCollectionsStr = missingCollections.join(', ');
        return res.status(404).json({
            success: false,
            message: `The following collections are missing: ${missingCollectionsStr}`,
            response: missingCollections
        });
    }

    const updateUserDataIsCollection = await User.findOneAndUpdate(
        {workspaceId},
        {
            $set: {
                isDatabaseReady: true,
                isCollectionReady: true
            }
        }
    )

    if(!updateUserDataIsCollection){
        return res.status(500).json({
            success: false,
            message: "Failed to update user collection status"
        });
    }

    res.status(200).json({
        success: true,
        message: "Excell the power of DoWell QR Code Generator",
    });
});


export {
    createCollection,
    checkDatabaseStatus,

}