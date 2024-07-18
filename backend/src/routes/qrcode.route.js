import { Router } from "express";
import { createQRcodeLiketype } from "../controllers/link.qrcode.controller.js";

const router = Router();

router.post("/create-likn-type-qrcode",createQRcodeLiketype );
export default router;
