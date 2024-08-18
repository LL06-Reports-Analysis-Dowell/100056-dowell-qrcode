import mongoose from 'mongoose';
import bcrypt from "bcryptjs";

const portfolioSchema = new mongoose.Schema({
    workspaceName: {
        type: String,
        required: true
    },
    portfolioName: {
        type: String,
        required: true
    },
    portfolioId: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    workspaceId: {
        type: String,
        required: true
    },
    memberType: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: [5, "password must be at least 8 chars"],
        select: false
    },
    dataType: {
        type: String,
        required: true
    },
    operationsRight: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    loginInfo: {
        count: {
            type: Number,
            default: 0
        },
        dates: {
            type: [Date],
            default: []
        }
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Hash password before saving
portfolioSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

portfolioSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Portfolio", portfolioSchema);
