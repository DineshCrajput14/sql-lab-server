import { Request, Response } from "express";
import { pool } from "../config/database";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { HTTP_STATUS } from "../config/constants";

export async function getLabDashboardSummary(
  _req: Request,
  res: Response
) {
  try {
    // Today's patient and report summary
    const [summaryRows]: any = await pool.execute(`
      SELECT
        COUNT(*) AS todayPatients,

        COALESCE(SUM(amount), 0) AS todayBilling,

        COALESCE(SUM(
          CASE
            WHEN reportstatus = 0 THEN 1
            ELSE 0
          END
        ), 0) AS pendingReports,

        COALESCE(SUM(
          CASE
            WHEN reportstatus = 1 THEN 1
            ELSE 0
          END
        ), 0) AS completedReports,

        COALESCE(SUM(
          CASE
            WHEN reportstatus = 0
              AND samplereceivedon IS NOT NULL
            THEN 1
            ELSE 0
          END
        ), 0) AS inProgressReports

      FROM tbtesttran
      WHERE date >= CURDATE()
        AND date < CURDATE() + INTERVAL 1 DAY
    `);

    // Today's total test details
    const [testRows]: any = await pool.execute(`
      SELECT
        COUNT(d.testid) AS todayTests
      FROM tbtesttran t
      LEFT JOIN tbtesttrandetail d
        ON d.testtranid = t.testtranid
      WHERE t.date >= CURDATE()
        AND t.date < CURDATE() + INTERVAL 1 DAY
    `);

    // Latest 10 patient registrations
    const [recentPatients]: any = await pool.execute(`
      SELECT
        t.testtranid,
        t.patientname,
        t.fhname,
        t.age,
        t.gender,
        t.serialno,
        t.regno,
        t.labno,
        t.date,
        t.amount,
        t.reportstatus,
        t.samplereceivedon,
        d.doctorname AS refdoctorname,

        (
          SELECT COUNT(*)
          FROM tbtesttrandetail td
          WHERE td.testtranid = t.testtranid
        ) AS testCount

      FROM tbtesttran t

      LEFT JOIN tbdoctormaster d
        ON t.refdoctor = d.doctorid

      ORDER BY t.date DESC, t.testtranid DESC
      LIMIT 10
    `);

    const summary = summaryRows[0] || {};
    const testSummary = testRows[0] || {};

    const data = {
      todayPatients: Number(summary.todayPatients || 0),
      todayTests: Number(testSummary.todayTests || 0),

      pendingReports: Number(summary.pendingReports || 0),
      completedReports: Number(summary.completedReports || 0),

      // This is billing amount, not verified payment collection.
      todayCollection: Number(summary.todayBilling || 0),

   testStatus: {
  pending: Math.max(
    0,
    Number(summary.pendingReports || 0) -
      Number(summary.inProgressReports || 0)
  ),

  inProgress: Number(summary.inProgressReports || 0),

  completed: Number(summary.completedReports || 0),
},


      recentPatients: recentPatients.map((patient: any) => ({
        ...patient,
        testtranid: Number(patient.testtranid),
        testCount: Number(patient.testCount || 0),
        amount: Number(patient.amount || 0),
        reportstatus: Number(patient.reportstatus || 0),
      })),
    };

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Laboratory Dashboard loaded successfully",
      data
    );
  } catch (error: any) {
    console.error("[LAB DASHBOARD SUMMARY]", error);

    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Failed to load Laboratory Dashboard",
      error.message
    );
  }
}