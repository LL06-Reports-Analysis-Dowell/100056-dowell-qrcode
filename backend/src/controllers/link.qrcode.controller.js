import { asyncHandler } from "../utils/asyncHandler.js";
import PayloadValidationServices from "../services/validation.services.js";
import Datacubeservices from '../services/datacube.services.js';
import { linkTypeQrcode } from "../services/qrcode.services.js";
import { linkqrcodeSchema,masterQrcodeRetrival,scanQrcodeSchema,myFridgeProtfolioSchema } from "../utils/payloadSchema.js";
import { createUUID, checkQrcodeDistance } from "../utils/helper.js";
import { mongoDbProducerServices,updateDatacubeService, updateChildQrCodeActivationStatus } from "../config/producer.config.js";
import LinkQrcode from "../models/linkqrcode.schema.js";

const createQRcodeLiketype = asyncHandler(async (req, res) => {
    const {
        numberOfQrcode, qrcodeColor, createdBy,
        latitude, longitude, isActive,
        location, fieldsData, workspaceId, activateBy,productName
    } = req.body;

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    const validatePayload = PayloadValidationServices.validateData(linkqrcodeSchema, {
        numberOfQrcode,
        qrcodeColor,
        createdBy,
        latitude,
        longitude,
        isActive,
        location,
        fieldsData,
        workspaceId,
        activateBy,
        productName
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const datacube = new Datacubeservices(apiKey.split(' ')[1]);


    const masterQrcodeId = createUUID("masterQrcode");
    const childQrcodeIds = Array(numberOfQrcode).fill().map(() => createUUID("childQrcode"));

    const masterQrcode = await linkTypeQrcode(masterQrcodeId, qrcodeColor,productName);
    if (!masterQrcode.success) {
        return res.status(400).json({
            success: false,
            message: masterQrcode.message,
        });
    }

    const childQrcodes = await Promise.all(
        childQrcodeIds.map(async (childQrcodeId) => {
            const qr = await linkTypeQrcode(childQrcodeId, qrcodeColor,productName);
            return { childQrcodeId, ...qr };
        })
    );

    if (childQrcodes.some(childQrcode => !childQrcode.success)) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate some child QR codes",
            errors: childQrcodes.filter(childQrcode => !childQrcode.success).map(childQrcode => childQrcode.message)
        });
    }

    console.log("generating child QR codes and master QR codes done...");

    const dataTobeInsertForMasterQrcode = {
        masterQrcodeId,
        masterQrcodeImageUrl: masterQrcode.response.qrcodeUrl,
        masterQrcodeLink: masterQrcode.response.qrcodeLink,
        qrcodeType: "link",
        latitude,
        longitude,
        isActive,
        location,
        fieldsData,
        workspaceId,
        activateBy,
        createdBy,
        productName,
        listOfChildQrcodes: childQrcodes.map(childQrcode => ({
            childQrcodeId: childQrcode.childQrcodeId,
            childQrcodeImageUrl: childQrcode.response.qrcodeUrl,
            childQrcodeLink: childQrcode.response.qrcodeLink
        })),
        createdAt: new Date().toISOString(),
        records: [{"record": "1", "type": "overall"}]
    };

    console.log("Starting to push master qrcode data...");
    const response = await datacube.dataInsertion(
        `${workspaceId}_qrcode_database`,
        `${workspaceId}_master_qrcode_list_collection`,
        dataTobeInsertForMasterQrcode
    );

    if (!response.success) {
        return res.status(500).json({
            success: false,
            message: "Failed to insert data into master QR code collection",
        });
    }

    console.log("Master Qrcode Data inserted...");
    console.log("Starting to push child qrcode data...");
    const dataTobeInsertedForChildQrcode = childQrcodes.map(childQrcode => ({
        childQrcodeId: childQrcode.childQrcodeId,
        masterQrcodeId,
        childQrcodeImageUrl: childQrcode.response.qrcodeUrl,
        childQrcodeLink: childQrcode.response.qrcodeLink,
        qrcodeType: "link",
        latitude: "",
        longitude: "",
        productName,
        isUsed: false,
        isActive: false,
        location: "",
        fieldsData: fieldsData.map(field => ({ fieldName: field, fieldValue: "" })),
        workspaceId,
        activateBy,
        createdBy,
        createdAt: new Date().toISOString(),
        records: [{"record": "1", "type": "overall"}]
    }));

    const insertToMongodb = await LinkQrcode.insertMany(dataTobeInsertedForChildQrcode);

    if (!insertToMongodb) {
        return res.status(400).json({
            success: false,
            message: "Failed to insert data into child QR code collection",
        });
    }
    console.log("Child Qrcode Data inserted...");
    console.log("Added to Q or redis server...");
    mongoDbProducerServices(dataTobeInsertedForChildQrcode);

    return res.status(200).json({
        success: true,
        message: "QR Code generated successfully",
        response: {
            masterQrcode: masterQrcode.response,
            childQrcodes: childQrcodes.map(childQrcode => ({
                childQrcodeId: childQrcode.childQrcodeId,
                childQrcodeImageUrl: childQrcode.response.qrcodeUrl,
                childQrcodeLink: childQrcode.response.qrcodeLink
            }))
        }
    });
});

const getQrcodeWorkspaceWise = asyncHandler(async(req, res )=> {
    const { workspaceId,limit,offset } = req.query;

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }
    const pageLimit = parseInt(limit)
    const pageOffset = parseInt(offset)

    const validatePayload = PayloadValidationServices.validateData(masterQrcodeRetrival, {
        workspaceId,
        pageLimit,
        pageOffset
    })

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const datacube = new Datacubeservices(apiKey.split(' ')[1]);

    const response = await datacube.dataRetrieval(
        `${workspaceId}_qrcode_database`,
        `${workspaceId}_master_qrcode_list_collection`,
        { workspaceId: workspaceId},
        limit,
        offset
    );

    if (!response.success) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch master QR codes from database",
        });
    }

    return res.status(302).json({
        success: true,
        message: "Fetched master QR codes successfully",
        response: response.data
    })
})

const getChildQrcodes = asyncHandler(async(req,res)=>{
    const { childQrcodeId,workspaceId } = req.query;

    const apiKey = req.headers['authorization'];
    if (!apiKey ||!apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    if (!childQrcodeId) {
        return res.status(400).json({
            success: false,
            message: "Child QR code id is required",
        });
    }

    const response = await LinkQrcode.findOne({
        childQrcodeId,
        workspaceId
    });

    if (!response) {
        return res.status(404).json({
            success: false,
            message: "Child QR code not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Fetched child QR code successfully",
        response
    })
})

const activateQrcodeByMasterQrcode = asyncHandler(async (req, res) => {
    const { masterQrcodeId, workspaceId } = req.query;

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    const datacube = new Datacubeservices(apiKey.split(' ')[1]);

    if (!masterQrcodeId || !workspaceId) {
        return res.status(400).json({
            success: false,
            message: "Master QR code id is required",
        });
    }

    const response = await LinkQrcode.find({
        masterQrcodeId,
        isActive: false,
        isUsed: false
    });

    if (!response) {
        return res.status(404).json({
            success: false,
            message: "No QR Code found or something went wrong",
        });
    }


    if (response.length === 0) {
        const masterQrcodeResponse = await datacube.dataUpdate(
            `${workspaceId}_qrcode_database`,
            `${workspaceId}_master_qrcode_list_collection`,
            {
                masterQrcodeId: masterQrcodeId
            },
            {
                isActive: false
            }
        );

        if (!masterQrcodeResponse.success) {
            return res.status(400).json({
                success: false,
                message: "Failed to update master QR code",
            });
        }

        if(masterQrcodeResponse.message ==="0 documents updated successfully!"){
            return res.status(400).json({
                success: false,
                message: "No QR Code found or something went wrong",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Activated successfully, all QR codes associated with this master QR code are active.",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Activated successfully",
        response: response[0]
    });
});

const updateChildQrocde = asyncHandler(async(req,res)=>{
    const { childQrcodeId, fieldsData, location,latitude,longitude } = req.body;

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    const response = await LinkQrcode.findOneAndUpdate(
        { childQrcodeId },
        {
            fieldsData,
            isActive: true,
            location,
            latitude,
            longitude,
            isUsed: true
        },
        { new: true }
    );

    if (!response) {
        return res.status(404).json({
            success: false,
            message: "Child QR code not found or Failed to update",
        });
    }

    console.log(response);
    const dataToBeUpdatedToDataCube = {
        workspaceId: response.workspaceId,
        childQrcodeId,
        latitude: response.latitude,
        longitude: response.longitude,
        isActive: response.isActive,
        isUsed: response.isUsed,
        location: response.location,
        fieldsData: response.fieldsData,
    }

    updateDatacubeService(dataToBeUpdatedToDataCube)

    return res.status(200)
    .json({
        success: true,
        message: "Child QR code updated successfully",
        response
    });

})

const scanMasterQrcode = asyncHandler(async (req, res) => {
    const { masterQrcodeId, latitude, longitude } = req.query;

    const validatePayload = PayloadValidationServices.validateData(scanQrcodeSchema, {
        qrcodeId: masterQrcodeId,
        latitude,
        longitude
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const response = await LinkQrcode.find({ masterQrcodeId, isActive: true });

    if (!response || response.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No active QR Code found or something went wrong",
        });
    }

    let activateBy;
    response.forEach(item => {
        if (item.activateBy === "customId" || item.activateBy === "location") {
            activateBy = item.activateBy;
        }
    });

    const filteredResponse = response.map(item => ({
        childQrcodeLink: item.childQrcodeLink,
        childQrcodeImageUrl: item.childQrcodeImageUrl,
        childQrcodeId: item.childQrcodeId,
        latitude: item.latitude,
        longitude: item.longitude,
        location: item.location,
        fieldsData: item.fieldsData.reduce((acc, field) => {
            acc[field.fieldName] = field.fieldValue;
            return acc;
        }, {}),
        workspaceId: item.workspaceId
    }));

    if (activateBy === "customId") {
        return res.status(200).json({
            success: true,
            message: "Scanned successfully with customId",
            response: filteredResponse
        });
    }

    if (activateBy === "location") {
        const checkDistanceStatus = await checkQrcodeDistance(
            5.0,
            [latitude, longitude],
            filteredResponse.map(item => [parseFloat(item.latitude), parseFloat(item.longitude)])
        );

        if (!checkDistanceStatus.success) {
            return res.status(403).json({
                success: false,
                message: "Distance exceeded from the master QR code location",
                errors: checkDistanceStatus.response
            });
        }

        const withinDistanceQRCodes = filteredResponse.filter((item, index) => 
            checkDistanceStatus.response.distance_data[index].within_distance
        );

        return res.status(200).json({
            success: true,
            message: "Scanned successfully with location",
            response: withinDistanceQRCodes
        });
    }
});

const scanChildQrcode = asyncHandler(async (req, res) => {
    const { childQrcodeId, latitude, longitude } = req.query;


    const validatePayload = PayloadValidationServices.validateData(scanQrcodeSchema, {
        qrcodeId: childQrcodeId,
        latitude,
        longitude
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const response = await LinkQrcode.findOne({ childQrcodeId });

    if (!response) {
        return res.status(404).json({
            success: false,
            message: `No child Qrcode found for this ${childQrcodeId}`
        });
    }
    if (!response.isActive) {
        return res.status(403).json({
            success: false,
            message: "QR code is not active"
        });
    }

    return res.status(200)
    .json({
        success: true,
        message: "Scanned successfully",
        response: {
            childQrcodeLink: response.childQrcodeLink,
            childQrcodeImageUrl: response.childQrcodeImageUrl,
            childQrcodeId: response.childQrcodeId,
            latitude: response.latitude,
            longitude: response.longitude,
            location: response.location,
            fieldsData: response.fieldsData.reduce((acc, field) => {
                acc[field.fieldName] = field.fieldValue;
                return acc;
            }, {}),
            workspaceId: response.workspaceId
        }
    })
    
});

const getMasterQrcodeDetails = asyncHandler(async (req, res) => {
    const { masterQrcodeId, workspaceId} = req.query;

    if (!masterQrcodeId || !workspaceId) {
        return res.status(400).json({
            success: false,
            message: "Master QR code id and workspace id are required",
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

    const masterQrcodeDetails = await datacube.dataRetrieval(
        `${workspaceId}_qrcode_database`,
        `${workspaceId}_master_qrcode_list_collection`,
        {
            masterQrcodeId: masterQrcodeId,
            workspaceId: workspaceId
        },
        1,
        0
    );

    if (!masterQrcodeDetails.success) {
        return res.status(400).json({
            success: false,
            message: "Failed to fetch master QR code details",
        });
    }

    const masterData = masterQrcodeDetails.data;

    if (!Array.isArray(masterData) || masterData.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Master QR code details are missing or in an incorrect format",
        });
    }

    const master = masterData[0];

    if (!master.listOfChildQrcodes || !Array.isArray(master.listOfChildQrcodes)) {
        return res.status(400).json({
            success: false,
            message: "Child QR codes are missing or in an incorrect format",
        });
    }

    const childQrcodeIds = master.listOfChildQrcodes.map(child => child.childQrcodeId);

    const childQrcodeDetails = await LinkQrcode.find({
        childQrcodeId: { $in: childQrcodeIds },
        workspaceId: workspaceId
    }).select('fieldsData childQrcodeLink childQrcodeImageUrl childQrcodeId isActive -_id');

    if (!childQrcodeDetails || childQrcodeDetails.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No child QR codes found",
        });
    }
    const response = {
        masterQrcodeId: master.masterQrcodeId,
        masterQrcodeImageUrl: master.masterQrcodeImageUrl,
        masterQrcodeLink: master.masterQrcodeLink,
        qrcodeType: master.qrcodeType,
        latitude: master.latitude,
        longitude: master.longitude,
        location: master.location,
        fieldsData: master.fieldsData,
        activateBy: master.activateBy,
        workspaceId: master.workspaceId,
        createdBy: master.createdBy,
        createdAt: master.createdAt,
        childQrcodeDetails: master.listOfChildQrcodes.map(child => {
            const childDetails = childQrcodeDetails.find(item => item.childQrcodeId === child.childQrcodeId);
            return {
                childQrcodeId: child.childQrcodeId,
                childQrcodeImageUrl: child.childQrcodeImageUrl,
                childQrcodeLink: child.childQrcodeLink,
                isActive: childDetails.isActive,
                fieldsData: childDetails.fieldsData
            };
        })
    };

    return res.status(200).json({
        success: true,
        message: "Fetched master and child QR code details successfully",
        response
    });
});

const deleteQrcodes = asyncHandler(async(req,res)=>{
    const { workspaceId } = req.query;

    if (!workspaceId) {
        return res.status(400).json({
            success: false,
            message: "Workspace id is required",
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

    const masterQrcodeResponse = await datacube.dataDelete(
        `${workspaceId}_qrcode_database`,
        `${workspaceId}_master_qrcode_list_collection`,
        { workspaceId: workspaceId }
    );

    if(!masterQrcodeResponse.success) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete master QR codes",
        });
    }

    const qrcodeResponse = await datacube.dataDelete(
        `${workspaceId}_qrcode_database`,
        `${workspaceId}_child_qrcode_list_collection`,
        { workspaceId: workspaceId }
    )

    if(!qrcodeResponse.success) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete child QR codes",
        });
    }
    console.log("clearing all data...");
    
    const responseLocalData = await LinkQrcode.deleteMany({
        workspaceId: workspaceId
    }) 

    if(!responseLocalData) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete local data",
        });
    }

    const statResponse = await datacube.dataDelete(
        `${workspaceId}_qrcode_database`,
        `${workspaceId}_qrcode_stat_collection`,
        { workspaceId: workspaceId }
    )

    if(!statResponse.success) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete QR code statistics",
        });
    }

    return res.status(200).json({
        success: true,
        message: "All Data has be deleted successfully",
    });

})

const getAllDataByProtfolioForFridgeApp = asyncHandler(async (req, res) => {
    const { workspaceId, protfolio, dataType } = req.body;

    const validatePayload = PayloadValidationServices.validateData(myFridgeProtfolioSchema, {
        workspaceId,
        protfolio,
        dataType
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    let dataToBeQueried;
    if (dataType === "all") {
        dataToBeQueried = {
            workspaceId: workspaceId,
            isUsed: true,
            fieldsData: {
                $elemMatch: {
                    fieldValue: protfolio
                }
            }
        };
    } else if (dataType === "active") {
        dataToBeQueried = {
            workspaceId: workspaceId,
            isActive: true,
            fieldsData: {
                $elemMatch: {
                    fieldValue: protfolio
                }
            }
        };
    } else if (dataType === "deactive") {
        dataToBeQueried = {
            workspaceId: workspaceId,
            isActive: false,
            fieldsData: {
                $elemMatch: {
                    fieldValue: protfolio
                }
            }
        };
    } else {
        dataToBeQueried = {
            workspaceId: workspaceId,
            isActive: true,
            fieldsData: {
                $elemMatch: {
                    fieldValue: protfolio
                }
            }
        };
    }

    const qrcodeData = await LinkQrcode.find(dataToBeQueried);

    if (!qrcodeData || qrcodeData.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No QR codes found for this workspace and portfolio combination"
        });
    }

    res.status(200).json({
        success: true,
        message: "Fetched all data successfully",
        response: qrcodeData
    });
});

const deactivateChildQRcode = asyncHandler(async (req, res) => {
    const { childQrcodeId, workspaceId } = req.query;

    if (!childQrcodeId || !workspaceId) {
        return res.status(400).json({
            success: false,
            message: "Child QR code id and workspace id are required",
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

    const response = await LinkQrcode.findOneAndUpdate(
        {
            childQrcodeId,
            workspaceId
        },
        {
            $set: { isActive: false }
        },
        {
            new: true
        }
    );

    if (!response) {
        return res.status(404).json({
            success: false,
            message: "Child QR code not found or something went wrong",
        });
    }

    console.log("Child Qrcode deactivate started ...");
    updateChildQrCodeActivationStatus({
        workspaceId,
        childQrcodeId,
        isActive: false
    })

    return res.status(200).json({
        success: true,
        message: "Child QR code deactivated successfully",
    });

})

export {
    createQRcodeLiketype,
    getQrcodeWorkspaceWise,
    getChildQrcodes,
    activateQrcodeByMasterQrcode,
    updateChildQrocde,
    scanMasterQrcode,
    scanChildQrcode,
    getMasterQrcodeDetails,
    deleteQrcodes,
    getAllDataByProtfolioForFridgeApp,
    deactivateChildQRcode
};
