import { z } from "zod";

const createCollectionSchema = z.object({
    workspaceId: z.string(),
    collectionName: z.string().min(1).max(100)
});


const linkqrcodeSchema = z.object({
    numberOfQrcode: z.number().min(1).max(100),
    qrcodeColor: z.string().optional().default("#000000"),
    createdBy: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    isActive: z.boolean().optional().default(true),
    location: z.string(),
    fieldsData: z.array(z.union([
        z.literal('name'),
        z.literal('description'),
        z.literal('link'),
        z.literal('new'),
        z.string(), // Allow other strings as well
    ])),
    workspaceId: z.string(),
});


export {
    createCollectionSchema,
    linkqrcodeSchema
};
