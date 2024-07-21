import { Router } from "express";
import healtcheckRoutes from './healthcheck.route.js'
import kitchensinkRoutes from './kitchensink.route.js'
import qrcodeRoutes from './qrcode.route.js'
import statsRoutes from './stats.route.js'
import authRoutes from './auth.route.js'

 
const router = Router()


router.use("/healtcheckup", healtcheckRoutes)
router.use("/auth", authRoutes)
router.use("/kitchen-sink", kitchensinkRoutes)
router.use("/qrcode", qrcodeRoutes)
router.use("/statistics", statsRoutes)


export default router