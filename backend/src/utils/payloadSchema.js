import { z } from "zod";

const createCollectionSchema = z.object({
    workspaceId: z.string(),
    collectionName: z.string().min(1).max(100)
});

const linkqrcodeSchema = z.object({
    numberOfQrcode: z.number().min(1).max(500),
    qrcodeColor: z.string().optional().default("#000000"),
    createdBy: z.string(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    isActive: z.boolean().optional().default(true),
    location: z.string().optional(),
    productName: z.enum(["qrcode","myfridge","kiosk","scale","others"]).default("others"),
    activateBy: z.enum(["location", "customId"]),
    fieldsData: z.array(z.union([
        z.literal('name'),
        z.literal('description'),
        z.literal('link'),
        z.literal('new'),
        z.string(),
    ])),
    workspaceId: z.string(),
}).refine(data => {
    if (data.activateBy === "customId") {
        return data.fieldsData.includes("customId");
    }
    return true;
}, {
    message: "fieldsData must include 'customId' when activateBy is 'customId'",
    path: ["fieldsData"]
});

const masterQrcodeRetrival = z.object({
    workspaceId: z.string(),
    limit: z.number().optional().default(10),
    offset: z.number().optional().default(0)
});

const scanQrcodeSchema = z.object({
    qrcodeId: z.string(),
    latitude: z.string(),
    longitude: z.string()
});

const statsSchema = z.object({
    qrcodeId: z.string(),
    latitude: z.string(),
    longitude: z.string()
})

const getAllStatsSchema = z.object({
    workspaceId: z.string().nonempty({ message: "Workspace ID is required" }),
    qrcodeId: z.string().optional(),
    dateRange: z.enum(['7days', '30days', '90days', '365days', 'custom']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

const saveUserSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    workspaceId: z.string()
});

const saveAgreementSchema = z.object({
    workspaceId: z.string(),
    userId: z.string(),
    isAccepted: z.boolean().optional().default(false),
    isDataSyncedRequested: z.boolean().default(false),
});

const myFridgeProtfolioSchema = z.object({
    workspaceId: z.string(),
    protfolio: z.string(),
    dataType: z.enum(["all", "active", "deactive"]).default("active").optional()
})

const savePortfolioSchema = z.object({
    workspaceName: z.string(),
    portfolioName: z.string().min(1).max(100),
    password: z.string().min(6).max(100)
});

export {
    createCollectionSchema,
    linkqrcodeSchema,
    masterQrcodeRetrival,
    scanQrcodeSchema,
    statsSchema,
    getAllStatsSchema,
    saveUserSchema,
    saveAgreementSchema,
    myFridgeProtfolioSchema,
    savePortfolioSchema
};
