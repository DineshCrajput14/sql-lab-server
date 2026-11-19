import * as testTranModel from "../models/testTranModel";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { HTTP_STATUS } from "../config/constants";

export async function getTestTrans(_req: Request, res: Response) {
  try {
    const testTrans = await testTranModel.getAll();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { testTrans }
    );
  } catch (error: any) {
    console.error("[LAB TEST getAll]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Lab Test records",
      error.message
    );
  }
}

export async function getTestTran(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Lab Test ID"
      );
    }

    const testTran = await testTranModel.getById(id);

    if (!testTran) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Lab Test record not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { testTran }
    );
  } catch (error: any) {
    console.error("[LAB TEST getById]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Lab Test record",
      error.message
    );
  }
}

export async function getTestTranDetails(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Lab Test ID"
      );
    }

    const testTran = await testTranModel.getById(id);

    if (!testTran) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Lab Test record not found"
      );
    }

    const details = await testTranModel.getDetails(id);

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { details }
    );
  } catch (error: any) {
    console.error("[LAB TEST getDetails]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Lab Test details",
      error.message
    );
  }
}

export async function createTestTran(
  req: Request,
  res: Response
) {
  console.log("[LAB TEST] CREATE API HIT");
  console.log("Request body:", req.body);

  try {
    const testTran = await testTranModel.create(req.body);

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      "Lab Test record created",
      { testTran }
    );
  } catch (error: any) {
    console.error("[LAB TEST create]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to create Lab Test record",
      error.message
    );
  }
}

export async function updateTestTran(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Lab Test ID"
      );
    }

    const testTran = await testTranModel.update(id, req.body);

    if (!testTran) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Lab Test record not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Lab Test record updated",
      { testTran }
    );
  } catch (error: any) {
    console.error("[LAB TEST update]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to update Lab Test record",
      error.message
    );
  }
}

export async function getNextReferenceNo(
  req: Request,
  res: Response
) {
  try {
    const nextReferenceNo =
      await testTranModel.getNextReferenceNo();

    console.log("Next Reference No:", nextReferenceNo);

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Next Reference Number generated successfully",
      String(nextReferenceNo)
    );

  } catch (error: any) {
    console.error("GET NEXT REFERENCE NO ERROR:", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to generate next Reference Number",
      error
    );
  }
}


export async function deleteTestTran(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Lab Test ID"
      );
    }

    const deleted = await testTranModel.remove(id);

    if (!deleted) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Lab Test record not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Lab Test record deleted",
      null
    );
  } catch (error: any) {
    console.error("[LAB TEST delete]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to delete Lab Test record",
      error.message
    );
  }
}

export async function getWidalMethods(
  _req: Request,
  res: Response
) {
  try {
    const methods = await testTranModel.getWidalMethods();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { methods }
    );
  } catch (error: any) {
    console.error("[WIDAL METHODS]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Widal Methods",
      error.message
    );
  }
}

export async function saveWidalTestData(
  req: Request,
  res: Response
) {
  try {
    const patientId = Number(req.params.id);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Patient ID"
      );
    }

    const widalData = await testTranModel.saveWidalOnly(
      patientId,
      req.body
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Widal data saved successfully",
      { widalData }
    );
  } catch (error: any) {
    console.error("[WIDAL SAVE ERROR]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to save Widal data",
      error.message
    );
  }
}


export async function getWidalData(
  req: Request,
  res: Response
) {
  try {
    const patientId = Number(req.params.id);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Patient ID"
      );
    }

    const widalData = await testTranModel.getWidalData(patientId);

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { widalData }
    );
  } catch (error: any) {
    console.error("[WIDAL DATA]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Widal data",
      error.message
    );
  }
}