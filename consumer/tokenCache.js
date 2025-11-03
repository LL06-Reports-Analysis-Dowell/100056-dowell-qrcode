// src/utils/tokenCache.js
import { redis, connectToMongo } from "./db.js";
import { JWTDecode } from "./helper.js";

export async function getTokenInfo(tokenId) {
  // Check cache first
  const cached = await redis.get(`token:${tokenId}`);
  if (cached) {
    console.log(`⚡ Cache hit for token ${tokenId}`);
    return JSON.parse(cached);
  }

  console.log(`📥 Cache miss — fetching token ${tokenId} from DB...`);

  // Fetch from DB
  const db = await connectToMongo(process.env.MONGO_DB_NAME);
  const tokenRecord = await db.collection(process.env.MONGO_TOKEN_COLL).findOne({ tokenId });
  if (!tokenRecord) throw new Error("Token not found");

  // Verify + decode JWT
  const decoded = JWTDecode(tokenRecord.token);

  // Compute TTL (seconds until expiration)
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setex(`token:${tokenId}`, ttl, JSON.stringify(decoded));
  }

  return decoded;
}