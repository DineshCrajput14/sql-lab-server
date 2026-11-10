import { Router } from "express";
import { authenticate } from "../middlewares/authentication";

import {
    getNextReferenceNo,
  getTestTrans,
  getTestTran,
  getTestTranDetails,
  createTestTran,
  updateTestTran,
  deleteTestTran

} from "../controllers/testTranController";

const router = Router();

router.use(authenticate);

// Lab Test Transactions
router.get("/test-tran/next-reference-no", getNextReferenceNo);
router.get("/test-tran", getTestTrans);
router.get("/test-tran/:id/details", getTestTranDetails);
router.get("/test-tran/:id", getTestTran);

router.post("/test-tran", createTestTran);
router.put("/test-tran/:id", updateTestTran);
router.delete("/test-tran/:id", deleteTestTran);

export default router;