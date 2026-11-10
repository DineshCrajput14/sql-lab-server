
import { Router } from "express";
import { authenticate } from "../middlewares/authentication";
import {
  getPatientTitles,
  getPatientTitle,
  createPatientTitle,
  updatePatientTitle,
  deletePatientTitle
} from "../controllers/patientTitlesController";

const router = Router();

router.use(authenticate);

// Patient Titles
router.get("/patient-title", getPatientTitles);
router.get("/patient-title/:id", getPatientTitle);
router.post("/patient-title", createPatientTitle);
router.put("/patient-title/:id", updatePatientTitle);
router.delete("/patient-title/:id", deletePatientTitle);

export default router;
