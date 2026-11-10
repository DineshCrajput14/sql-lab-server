
import { Router } from "express";
import { authenticate } from "../middlewares/authentication";
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  updateTestGroupOrder,
} from "../controllers/testgroupController";
import { getHeapCodeStatistics } from "node:v8";

const router = Router();

router.use(authenticate);
router.get("/testgroups", getGroups);
router.get("/testgroups/:id", getGroup);
router.post("/testgroups", createGroup);
router.put("/testgroups/order", updateTestGroupOrder);
router.put("/testgroups/:id", updateGroup);
router.delete("/testgroups/:id", deleteGroup);



export default router;