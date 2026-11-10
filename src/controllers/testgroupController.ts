
import * as groupModel from "../models/testgroupModel";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { HTTP_STATUS } from "../config/constants";

export async function getGroups(_req: Request, res: Response) {
  try {
    const groups = await groupModel.getAll();

    return sendSuccess(res, HTTP_STATUS.OK, "", { groups });
  } catch (error: any) {
    console.error("[GROUPS getAll]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load groups",
      error.message
    );
  }
}

export async function getGroup(req: Request, res: Response) {
  try {
    const group = await groupModel.getById(Number(req.params.id));

    if (!group) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Group not found"
      );
    }

    return sendSuccess(res, HTTP_STATUS.OK, "", { group });
  } catch (error: any) {
    console.error("[GROUPS getById]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load group",
      error.message
    );
  }
}

export async function createGroup(req: Request, res: Response) {
  try {
    const group = await groupModel.create(req.body);

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      "Group created",
      { group }
    );
  } catch (error: any) {
    console.error("[GROUPS create]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to create group",
      error.message
    );
  }
}

export async function updateGroup(req: Request, res: Response) {
  try {
    const group = await groupModel.update(
      Number(req.params.id),
      req.body
    );

    if (!group) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Group not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Group updated",
      { group }
    );
  } catch (error: any) {
    console.error("[GROUPS update]", error);

    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      error.message || "Failed to update group",
      error.message
    );
  }
}

export async function deleteGroup(req: Request, res: Response) {
  try {
    const ok = await groupModel.remove(Number(req.params.id));

    if (!ok) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "Group not found"
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Group deleted",
      null
    );
  } catch (error: any) {
    console.error("[GROUPS delete]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to delete group",
      error.message
    );
  }
}

export const updateTestGroupOrder = async (req, res) => {
  try {
    const { groups } = req.body;

    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Groups are required",
      });
    }

    await groupModel.updateTestGroupOrder(groups);

    return res.status(200).json({
      success: true,
      message: "Test Group order updated successfully",
    });
  } catch (error) {
    console.error("Update Test Group Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Test Group order",
    });
  }
};
