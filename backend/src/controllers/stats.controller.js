import { asyncHandler } from "../utils/asyncHandler.js";
import PayloadValidationServices from "../services/validation.services.js";
import Datacubeservices from '../services/datacube.services.js';
import { statsSchema,getAllStatsSchema } from "../utils/payloadSchema.js";
import { saveStatsToCollection } from "../config/producer.config.js";
import { calculateDateRange } from "../utils/helper.js";


const saveStats = asyncHandler(async(req,res)=>{
    const { qrcodeId, latitude, longitude } = req.query

    const validatePayload = PayloadValidationServices.validateData(statsSchema, {
        qrcodeId,
        latitude,
        longitude,
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }
    const dataToInsert = {
        qrcodeId,
        latitude,
        longitude,
        scannedAt: new Date().toISOString(),
    }
    saveStatsToCollection(dataToInsert)

    return res.status(200)
    .json({
        success: true,
        message: "Stats saved successfully"
    })
    
});


const getAllStats = asyncHandler(async (req, res) => {
    const { workspaceId, qrcodeId, dateRange, startDate, endDate } = req.body;

    const apiKey = req.headers['authorization'];
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }

    const validatePayload = PayloadValidationServices.validateData(getAllStatsSchema, {
        workspaceId,
        qrcodeId,
        dateRange,
        startDate,
        endDate,
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const datacube = new Datacubeservices(apiKey.split(' ')[1]);

    let query = { workspaceId };
    if (qrcodeId) {
        query.qrcodeId = qrcodeId;
    }

    if (dateRange) {
        const { startDate: rangeStartDate, endDate: rangeEndDate } = calculateDateRange(dateRange);
        query.scannedAt = { $gte: rangeStartDate.toISOString(), $lte: rangeEndDate.toISOString() };
    } else if (startDate && endDate) {
        query.scannedAt = { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() };
    }

    const stats = await datacube.dataRetrieval(
        `${workspaceId}_qrcode_database`,
        `${workspaceId}_qrcode_stat_collection`,
        query,
        10000,
        0
    );

    if (!stats.success) {
        return res.status(404).json({
            success: false,
            message: "No stats found for the provided criteria",
        });
    }

    // Aggregating results
    let result = { count: stats.data.length };
    if (dateRange || (startDate && endDate)) {
        const dateCounts = stats.data.reduce((acc, item) => {
            const date = item.scannedAt.split('T')[0];
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date]++;
            return acc;
        }, {});
        result.dateScanned = dateCounts;
    }

    return res.status(200).json({
        success: true,
        message: "Stats retrieved successfully",
        response: result
    });
});


export {
    saveStats,
    getAllStats
}