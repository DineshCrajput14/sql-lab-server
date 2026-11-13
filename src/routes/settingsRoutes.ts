import { Router } from "express";
import {
  getControlPanel,
  saveControlPanel,
  checkTestTranData
} from "../controllers/settingsController";
import { authenticate } from "../middlewares/authentication";

const router = Router();

router.use(authenticate);

router.get("/control-panel-settings", getControlPanel);
router.post("/control-panel-settings", saveControlPanel);
router.get( "/control-panel-settings/check-test-tran",  checkTestTranData);
export default router;
