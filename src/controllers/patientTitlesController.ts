
import * as patientTitlesModel from "../models/patientTitlesModel";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { HTTP_STATUS } from "../config/constants";

export async function getPatientTitles(
  _req: Request,
  res: Response
) {
  try {
    const patientTitles = await patientTitlesModel.getAll();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { patientTitles }
    );
  } catch (error: any) {
    console.error("[PATIENT TITLES getAll]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Patient Titles",
      error.message
    );
  }
}

export async function getPatientTitle(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Patient Title ID"
      );
    }

    const patientTitle = await patientTitlesModel.getById(id);

    if (!patientTitle) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Patient Title not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "",
      { patientTitle }
    );
  } catch (error: any) {
    console.error("[PATIENT TITLES getById]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Patient Title",
      error.message
    );
  }
}


export async function createPatientTitle(
  req: Request,
  res: Response
): Promise<any> {
  try {
    console.log("[PATIENT TITLES] CREATE API HIT");
    console.log("Request body:", req.body);

    const patientTitle = await patientTitlesModel.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Patient Title added successfully.",
      data: { patientTitle },
    });
  } catch (error: any) {
    console.error("[PATIENT TITLES create] Error:", error.message);

    if (error.message === "Patient Title already exists.") {
      return res.status(409).json({
        success: false,
        message: "Patient Title already exists.",
      });
    }

    if (
      error.message === "Patient Title is required" ||
      error.message === "Patient Title is required." ||
      error.message === "Patient Title cannot exceed 100 characters"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to save Patient Title.",
    });
  }
}




export async function updatePatientTitle(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Patient Title ID"
      );
    }

    const patientTitle = await patientTitlesModel.update(
      id,
      req.body
    );

    if (!patientTitle) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Patient Title not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Patient Title updated",
      { patientTitle }
    );
  } catch (error: any) {
    console.error("[PATIENT TITLES update]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to update Patient Title",
      error.message
    );
  }
}

export async function deletePatientTitle(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Invalid Patient Title ID"
      );
    }

    const deleted = await patientTitlesModel.remove(id);

    if (!deleted) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Patient Title not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Patient Title deleted",
      null
    );
  } catch (error: any) {
    console.error("[PATIENT TITLES delete]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to delete Patient Title",
      error.message
    );
  }
}
