import { Router } from "express";
import { authenticate } from "../middlewares/authentication";

import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctors,
  updateDoctor
} from "../controllers/doctorController";

import {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest
} from "../controllers/testController";

const router = Router();

router.use(authenticate);



// Test Master
router.get("/test-master", getTests);
router.get("/test-master/:id", getTest);
router.post("/test-master", createTest);
router.put("/test-master/:id", updateTest);
router.delete("/test-master/:id", deleteTest);

export default router;