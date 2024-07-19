import { asyncHandler } from "../utils/asyncHandler.js";
import PayloadValidationServices from "../services/validation.services.js";
import Datacubeservices from '../services/datacube.services.js';
import { linkTypeQrcode } from "../services/qrcode.services.js";
import { linkqrcodeSchema,masterQrcodeRetrival,scanQrcodeSchema } from "../utils/payloadSchema.js";
import { createUUID } from "../utils/helper.js";
import { mongoDbProducerServices,updateDatacubeService } from "../config/producer.config.js";
import LinkQrcode from "../models/linkqrcode.schema.js";
import { getWorkSpaceId } from "../services/api.services.js"

const createQRcodeLiketype = asyncHandler(async (req, res) => {
    const {
        numberOfQrcode, qrcodeColor, createdBy,
        latitude, longitude, isActive,
        location, fieldsData, workspaceId, activateBy
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
        activateBy
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

    const masterQrcode = await linkTypeQrcode(masterQrcodeId, qrcodeColor);
    if (!masterQrcode.success) {
        return res.status(400).json({
            success: false,
            message: masterQrcode.message,
        });
    }

    const childQrcodes = await Promise.all(
        childQrcodeIds.map(async (childQrcodeId) => {
            const qr = await linkTypeQrcode(childQrcodeId, qrcodeColor);
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
    const { masterQrcodeId } = req.query;

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    const datacube = new Datacubeservices(apiKey.split(' ')[1]);

    if (!masterQrcodeId) {
        return res.status(400).json({
            success: false,
            message: "Master QR code id is required",
        });
    }

    const response = await LinkQrcode.find({
        masterQrcodeId,
        isActive: false
    });

    if (!response) {
        return res.status(404).json({
            success: false,
            message: "No QR Code found or something went wrong",
        });
    }

    if (response.length === 0) {
        const workspaceId = (await getWorkSpaceId(apiKey.split(' ')[1]))?.workspaceId;
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
            message: "Activated successfully, all QR codes associated with this master QR code are inactive.",
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
            longitude
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

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

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
        return res.status(200).json({
            success: true,
            message: "Scanned successfully with location",
            response: filteredResponse
        });
    }
});

// const scanChildQrcode = 


export {
    createQRcodeLiketype,
    getQrcodeWorkspaceWise,
    getChildQrcodes,
    activateQrcodeByMasterQrcode,
    updateChildQrocde,
    scanMasterQrcode
};
