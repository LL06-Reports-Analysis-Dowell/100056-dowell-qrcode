import mongoose from "mongoose";

const mongoUri = process.env.MONGO_DB_URI+"/"+process.env.MONGO_DB_NAME;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

const exhibitorSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: ''
    },
    createdAt: {
        type: String,
        default: ''
    },
    updatedAt: {
        type: String,
        required: true
    },
    status:{
        type: String,
        default: false
    }
});

export default mongoose.model('ExhibitorSchema', exhibitorSchema);
