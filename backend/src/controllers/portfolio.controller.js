import { asyncHandler } from "../utils/asyncHandler.js";
import PayloadValidationServices from "../services/validation.services.js";
import Portfolio from "../models/portfolio.schema.js";
import { savePortfolioSchema } from "../utils/payloadSchema.js";
import { dowellLoginService } from "../services/api.services.js";
import User from "../models/auth.schema.js";

const portfolioLogin = asyncHandler(async (req, res) => {
    const { workspaceName, portfolioName, password } = req.body;

    // Validate payload
    const validatePayload = PayloadValidationServices.validateData(savePortfolioSchema, {
        workspaceName,
        portfolioName,
        password
    });

    if (!validatePayload.isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload",
            errors: validatePayload.errors
        });
    }

    const portfolio = await Portfolio.findOne({ workspaceName, portfolioName }).select('+password');

    if (portfolio) {
        
        if (password !== portfolio.password) {
            return res.status(200).json({
                success: true,
                message: "Please provide the correct password" 
            });
        }

        const updateUserDetails = await Portfolio.findByIdAndUpdate(
            portfolio._id,
            {
                $inc: { "loginInfo.count": 1 },
                $push: { "loginInfo.dates": new Date() }
            },
            { new: true }
        );

        if (!updateUserDetails) {
            return res.status(500).json({
                success: false,
                message: "Failed to update user login info"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            response: updateUserDetails
        });
    }
     

    const dowellLoginDetails = await dowellLoginService(portfolioName, password, workspaceName);

    if (!dowellLoginDetails.success) {
        return res.status(401).json({
            success: false,
            message: dowellLogin.message
        });
    }

    const dowellLogin = dowellLoginDetails.userinfo


    const ownerDetails = await User.findOne({ username: workspaceName });

    if (!ownerDetails) {
        return res.status(404).json({
            success: false,
            message: "Owner not found, please contact flyer distributor."
        });
    }

    if (!ownerDetails.isActive || !ownerDetails.isDatabaseReady || !ownerDetails.isCollectionReady) {
        let issues = [];
    
        if (!ownerDetails.isActive) {
            issues.push("User's account is not active");
        }
        if (!ownerDetails.isDatabaseReady) {
            issues.push("Database is not ready");
        }
        if (!ownerDetails.isCollectionReady) {
            issues.push("Collections are not ready");
        }
    
        const message = issues.join(", ") + ". Please contact the administrator or flyer distributor.";
    
        return res.status(403).json({
            success: false,
            message: message
        });
    }

    const portfolioDetails = await Portfolio.create({
        workspaceName: workspaceName,
        portfolioName: portfolioName,
        email: "",
        portfolioId: dowellLogin.portfolio_info.username[0],
        workspaceId: dowellLogin.userinfo.owner_id,
        memberType: dowellLogin.portfolio_info.member_type,
        password: password,
        dataType: dowellLogin.portfolio_info.data_type,
        operationsRight: dowellLogin.portfolio_info.operations_right,
        status: dowellLogin.portfolio_info.status,
        ownerId: ownerDetails._id,
    });

    
    if (!portfolioDetails) {
        return res.status(500).json({
            success: false,
            message: "Failed to create user using portfolio"
        });
    }

    return res.status(200).json({
        success: true,
        message: "Portfolio login successful",
        response: portfolioDetails
    });
});

const portfolioDetails = asyncHandler(async (req, res) => {
    const { portfolioName } = req.query;

    if (!portfolioName) {
        return res.status(400).json({
            success: false,
            message: "Please provide portfolioName"
        });
    }

    const portfolio = await Portfolio.findOne({ portfolioName }).select('+password');
    
    if (!portfolio) {
        return res.status(404).json({
            success: false,
            message: "Portfolio not found"
        });
    }

    return res.status(200).json({
        success: true,
        message: "Portfolio details retrieved successfully",
        response: portfolio
    });
});

export {
    portfolioLogin,
    portfolioDetails
}
