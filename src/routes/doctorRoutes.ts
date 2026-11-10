import { Router } from "express";
import { authenticate } from "../middlewares/authentication";
import {
  getCategoriesListHandler,
  getCategoryDetailHandler,
  createNewCategoryHandler,
  editCategoryHandler,
  removeCategoryHandler,
} from "../controllers/categoryController";
import { createDoctor, deleteDoctor, getDoctor, getDoctors, updateDoctor } from "../controllers/doctorController";
import { getHeapCodeStatistics } from "node:v8";

const router = Router();

router.use(authenticate);

router.get("/doctors", getDoctors);
router.get("/doctors/:id", getDoctor);
router.post("/doctors", createDoctor);
router.put("/doctors/:id", updateDoctor);
router.delete("/doctors/:id", deleteDoctor);

export default router;
