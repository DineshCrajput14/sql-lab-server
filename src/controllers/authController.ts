import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  findUserById,
  findUserWithPasswordById,
  updateUserPassword,
} from "../models/authModel";
import { getUserPermissions } from "../models/userModel";
import { getPrimaryOrganization } from "../models/organizationModel";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { HTTP_STATUS } from "../config/constants";
import { AuthRequest } from "../middlewares/authentication";
import { env } from "../config/env.config";

export async function login(req: Request, res: Response) {
  try {
    const usernameOrEmail = req.body.username || req.body.email;
    const { password } = req.body;

    if (!usernameOrEmail || !password) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Username and password are required",
      );
    }

    const user = await findUserByEmail(usernameOrEmail);
    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid username or password",
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid username or password",
      );
    }

    if (user.status && user.status.toLowerCase() === "inactive") {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Your account is inactive. Please contact the administrator.",
      );
    }

    const userRoleCode = user.userRoleCode;
    const secret = env.JWT.SECRET;
    const token = jwt.sign(
      { id: user.id, email: user.email, userRoleCode },
      secret,
      { expiresIn: "1h" },
    );

    const organization = await getPrimaryOrganization();
    const { allowedAppModules, allowedAppActivities } =
      getUserPermissions(user);

    return sendSuccess(res, HTTP_STATUS.OK, "", {
      token,
      user: {
        id: user.id,
        name: user.name,
        mobileNo: user.phone,
        imageUrl: user.imageUrl || "",
        userRoleCode,
      },
      organization,
      allowedAppModules,
      allowedAppActivities,
    });
  } catch (error: any) {
  console.error("[LOGIN ERROR]", error);
  return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, "Server error during authentication", error.message);
}
}

export async function getProfile(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const user = await findUserById(authReq.user.id);
    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "User profile not found");
    }

    const organization = await getPrimaryOrganization();

    return sendSuccess(res, HTTP_STATUS.OK, "User profile  successfully", {
      user,
      organization,
    });
  } catch (error: any) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Error fetching user profile",
      error.message,
    );
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Old password and new password are required",
      );
    }

    if (oldPassword === newPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "New password must be different from the old password.",
      );
    }

    if (newPassword.trim().length < 6) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "New password must be at least 6 characters",
      );
    }

    const user = await findUserWithPasswordById(authReq.user.id);
    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "User not found");
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Old password is incorrect",
      );
    }

    const trimmedNewPassword = newPassword.trim();
    const hashedNewPassword = await bcrypt.hash(trimmedNewPassword, 10);
    await updateUserPassword(user.id, hashedNewPassword, trimmedNewPassword);

    return sendSuccess(res, HTTP_STATUS.OK, "Password changed successfully");
  } catch (error: any) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to change password",
      error.message,
    );
  }
}
