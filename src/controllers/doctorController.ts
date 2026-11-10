import * as doctorModel from "../models/doctorModel";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { HTTP_STATUS } from "../config/constants";

export async function getDoctors(_req: Request, res: Response) {
  try {
    const doctors = await doctorModel.getAll();
    return sendSuccess(res, HTTP_STATUS.OK, "", { doctors });
  } catch (error: any) {
    console.error("[DOCTORS getAll]", error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to load doctors", error.message);
  }
}

export async function getDoctor(req: Request, res: Response) {
  try {
    const doctor = await doctorModel.getById(Number(req.params.id));
    if (!doctor) return sendError(res, HTTP_STATUS.NOT_FOUND, "Doctor not found");
    return sendSuccess(res, HTTP_STATUS.OK, "", { doctor });
  } catch (error: any) {
    console.error("[DOCTORS getById]", error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to load doctor", error.message);
  }
}

export async function createDoctor(req: Request, res: Response) {
   console.log("CREATE DOCTOR API HIT");
  console.log("Request body:", req.body);
  console.log("Commission received:", req.body?.commissionPvalue);
  console.log("Alternative commission:", req.body?.commissionpvalue);
  try {
    const doctor = await doctorModel.create(req.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, "Doctor created", { doctor });
  } catch (error: any) {
    console.error("[DOCTORS create]", error);
    return sendError(res, HTTP_STATUS.BAD_REQUEST, error.message || "Failed to create doctor", error.message);
  }
}

export async function updateDoctor(req: Request, res: Response) {

// console.log("UPDATE DOCTOR CONTROLLER HIT");
// console.log("Request body:", req.body);
  try {
    const doctor = await doctorModel.update(Number(req.params.id), req.body);
    if (!doctor) return sendError(res, HTTP_STATUS.NOT_FOUND, "Doctor not found");
    return sendSuccess(res, HTTP_STATUS.OK, "Doctor updated", { doctor });
  } catch (error: any) {
    console.error("[DOCTORS update]", error);
    return sendError(res, HTTP_STATUS.BAD_REQUEST, error.message || "Failed to update doctor", error.message);
  }
}
export async function deleteDoctor(req: Request, res: Response) {
  try {
    const ok = await doctorModel.remove(Number(req.params.id));
    if (!ok) return sendError(res, HTTP_STATUS.NOT_FOUND, "Doctor not found");
    return sendSuccess(res, HTTP_STATUS.OK, "Doctor deleted", null);
  } catch (error: any) {
    console.error("[DOCTORS delete]", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to delete doctor",
      error.message,
    );
  }
}
