import { Router } from "express";
import { createQRcodeLiketype,getQrcodeWorkspaceWise,getChildQrcodes,activateQrcodeByMasterQrcode,updateChildQrocde,scanMasterQrcode } from "../controllers/link.qrcode.controller.js";

const router = Router();

router.post("/create-likn-type-qrcode",createQRcodeLiketype );
router.get("/all-master-qrcodes",getQrcodeWorkspaceWise);
router.get("/child-qrcode",getChildQrcodes);
router.get("/activate-qrcode-by-master-qrcode",activateQrcodeByMasterQrcode);
router.post("/activate-child-qrcode",updateChildQrocde);
router.get("/scan-master-qrcode",scanMasterQrcode);
export default router;
