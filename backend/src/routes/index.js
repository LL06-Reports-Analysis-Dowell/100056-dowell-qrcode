import { Router } from "express";
import healtcheckRoutes from './healthcheck.route.js'
import kitchensinkRoutes from './kitchensink.route.js'
import qrcodeRoutes from './qrcode.route.js'

 
const router = Router()


router.use("/healtcheckup", healtcheckRoutes)
router.use("/kitchen-sink", kitchensinkRoutes)
router.use("/qrcode", qrcodeRoutes)


export default router