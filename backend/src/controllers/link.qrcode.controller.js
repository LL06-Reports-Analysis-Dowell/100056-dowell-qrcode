import { asyncHandler } from "../utils/asyncHandler.js";
import PayloadValidationServices from "../services/validation.services.js";
import Datacubeservices from '../services/datacube.services.js';
import { linkTypeQrcode } from "../services/qrcode.services.js";
import { linkqrcodeSchema } from "../utils/payloadSchema.js";
import { createUUID } from "../utils/helper.js";
import { mongoDbProducerServices } from "../config/producer.config.js";
import LinkQrcode from "../models/linkqrcode.schema.js"

const createQRcodeLiketype = asyncHandler(async (req, res) => {
    const {
        numberOfQrcode, qrcodeColor, createdBy,
        latitude, longitude, isActive,
        location, fieldsData, workspaceId
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
        workspaceId
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

export {
    createQRcodeLiketype
};
