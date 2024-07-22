import { Router } from "express";
import { createQRcodeLiketype,getQrcodeWorkspaceWise,getChildQrcodes,activateQrcodeByMasterQrcode,updateChildQrocde,scanMasterQrcode,scanChildQrcode,getMasterQrcodeDetails } from "../controllers/link.qrcode.controller.js";

const router = Router();

router.post("/create-likn-type-qrcode",createQRcodeLiketype );
router.get("/all-master-qrcodes",getQrcodeWorkspaceWise);
router.get("/child-qrcode",getChildQrcodes);
router.get("/activate-qrcode-by-master-qrcode",activateQrcodeByMasterQrcode);
router.post("/update-child-qrcode",updateChildQrocde);
router.get("/scan-master-qrcode",scanMasterQrcode);
router.get("/scan-child-qrcode",scanChildQrcode);
router.get("/master-qrcode",getMasterQrcodeDetails);
export default router;
