import jwt from "jsonwebtoken";
const JWTDecode = (token) => {
    try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Original payload:", decoded);
    return decoded;
    } catch (error) {
    console.error("❌ Invalid or expired token:", error.message);
    }
}

export { JWTDecode }