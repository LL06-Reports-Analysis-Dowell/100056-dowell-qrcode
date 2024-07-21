import { asyncHandler } from "../utils/asyncHandler.js";
import PayloadValidationServices from "../services/validation.services.js";
import User from "../models/auth.schema.js"
import { saveUserSchema } from "../utils/payloadSchema.js"
import { getUserAPIKey } from "../services/api.services.js";

const saveUser = asyncHandler(async(req,res)=>{
    const { username, email, workspaceId} = req.body;

    const validatePayload = PayloadValidationServices.validateData(saveUserSchema, {
        username,
        email,
        workspaceId,
        
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const apiKey = await getUserAPIKey(workspaceId);

    if (!apiKey.success) {
        return res.status(400).json({
            success: false,
            message: "Failed to get user api key"
        });
    }

    const user = await User.create({
        username,
        email,
        workspaceId,
        apiKey: apiKey?.apiKey
    });

    if (!user){
        return res.status(500).json({
            success: false,
            message: "Failed to save user"
        });
    }

    return res.status(201)
    .json({
        success: true,
        message: "User saved successfully",
        response : user
    })

})

const getUser = asyncHandler(async(req, res) => {
    const { workspaceId } = req.query;

    if (!workspaceId) {
        return res.status(400).json({
            success: false,
            message: "Workspace ID is required",
        });
    }

    const user = await User.findOne({ workspaceId });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const updatedUser = await User.findOneAndUpdate(
        { workspaceId },
        {
            $inc: { 'loginInfo.count': 1 },
            $push: { 'loginInfo.dates': new Date() }
        },
        { new: true }
    );

    if(!user.isActive){
        return res.status(401)
        .json({
            success: false,
            message: "Please contact the administrator , You account has been disabled."
        });
    }

    if(!updatedUser) {
        return res.status(500).json({
            success: false,
            message: "Failed to update user login info"
        });
    }

    if (!user.isDatabaseReady) {
        return res.status(404)
        .json({
            success: false,
            message: "User's database is not ready, Please contact the administrator",
            isDatabaseReady: user.isDatabaseReady
        });
    }

    if (!user.isCollectionReady) {
        return res.status(404)
        .json({
            success: false,
            message: "User's collection is not ready, Please contact the administrator",
            isCollectionReady: user.isCollectionReady
        });
    }

    return res.status(200)
    .json({
        success: true,
        message: "User retrieved successfully",
        response: user
    });
})



export {
    saveUser,
    getUser,
}