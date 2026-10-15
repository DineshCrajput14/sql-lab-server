import { Router } from "express";
import {
  login,
  getProfile,
  changePassword,
} from "../controllers/authController";
import { authenticate } from "../middlewares/authentication";

const router = Router();

router.post("/v1/authenticate", login);
router.post("/authenticate", login);
router.get("/auth/profile", authenticate, getProfile);
router.put("/auth/change-password", authenticate, changePassword);

export default router;
