import mongoose from "mongoose";

const fieldDataSchema = new mongoose.Schema({
    fieldName: {
        type: String,
        required: true,
    },
    fieldValue: {
        type: String,
        required: true,
        default: ''
    }
}, { _id: false });

const linkQrcodeSchema = new mongoose.Schema({
    childQrcodeId: {
        type: String,
        required: true,
        unique: true
    },
    masterQrcodeId: {
        type: String,
        required: true
    },
    childQrcodeImageUrl: {
        type: String,
        required: true
    },
    childQrcodeLink: {
        type: String,
        required: true
    },
    qrcodeType: {
        type: String,
        required: true,
        enum: ['link']
    },
    latitude: {
        type: String,
        default: ''
    },
    longitude: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: false
    },
    location: {
        type: String,
        default: ''
    },
    fieldsData: {
        type: [{
            fieldName: String,
            fieldValue: String
        }],
        required: true,
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'fieldsData must contain at least one field'
        }
    },
    workspaceId: {
        type: String,
        required: true
    },
    activateBy:{
        type: String,
        required: true,
        enum: ['customId', 'location']
    },
    link: {
        type: String,
        default: ''
    },
    createdBy: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('LinkQrcode', linkQrcodeSchema);
