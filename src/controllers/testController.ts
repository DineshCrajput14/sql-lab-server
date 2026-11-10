import * as testMasterModel from "../models/testmodel";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { HTTP_STATUS } from "../config/constants";

export async function getTests(_req: Request, res: Response) {
  try {
    const tests = await testMasterModel.getAll();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { tests }
    );
  } catch (error: any) {
    console.error("[TEST MASTER getAll]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load tests",
      error.message
    );
  }
}

export async function getTest(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid test ID"
      );
    }

    const test = await testMasterModel.getById(id);

    if (!test) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Test not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { test }
    );
  } catch (error: any) {
    console.error("[TEST MASTER getById]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load test",
      error.message
    );
  }
}

export async function createTest(req: Request, res: Response) {
  console.log("[TEST MASTER] CREATE API HIT");
  console.log("Request body:", req.body);

  try {
    const test = await testMasterModel.create(req.body);

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      "Test created",
      { test }
    );
  } catch (error: any) {
    console.error("[TEST MASTER create]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to create test",
      error.message
    );
  }
}

export async function updateTest(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid test ID"
      );
    }

    const test = await testMasterModel.update(id, req.body);

    if (!test) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Test not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Test updated",
      { test }
    );
  } catch (error: any) {
    console.error("[TEST MASTER update]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to update test",
      error.message
    );
  }
}

export async function deleteTest(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid test ID"
      );
    }

    const deleted = await testMasterModel.remove(id);

    if (!deleted) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Test not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Test deleted",
      null
    );
  } catch (error: any) {
    console.error("[TEST MASTER delete]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to delete test",
      error.message
    );
  }
}