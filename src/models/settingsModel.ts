import { pool } from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface ControlPanelSettingsData {
  tenantRegistrationNumberAuto: boolean;
  nextNumberTenant?: number | string;
  nextNumberReceipt?: number | string;
  serialno?: boolean | number;
  startSerialno?: number | string | null;
}

// GET CONTROL PANEL SETTINGS
export async function getControlPanelSettings(): Promise<{
  controlPanelSetting: {
    tenantRegistrationNumberAuto: boolean;
    serialno: boolean;
    startSerialno: number | string;
  };
  nextNumber: {
    nextNumberTenant: number | string;
    nextNumberReceipt?: number | string;
  };
}> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
      tenant_registration_number_auto,
      next_number_tenant,
      next_number_receipt,
      serialno,
      start_serialno
    FROM control_panel_settings
    ORDER BY id ASC
    LIMIT 1`
  );

  if (!rows || rows.length === 0) {
    return {
      controlPanelSetting: {
        tenantRegistrationNumberAuto: true,
        serialno: false,
        startSerialno: 1,
      },
      nextNumber: {
        nextNumberTenant: 1,
        nextNumberReceipt: 101,
      },
    };
  }

  return {
    controlPanelSetting: {
      tenantRegistrationNumberAuto: Boolean(
        rows[0].tenant_registration_number_auto
      ),

      serialno: Boolean(rows[0].serialno),

      startSerialno: rows[0].start_serialno ?? 1,
    },

    nextNumber: {
      nextNumberTenant: rows[0].next_number_tenant,
      nextNumberReceipt: rows[0].next_number_receipt || 101,
    },
  };
}

// SAVE CONTROL PANEL SETTINGS
export async function saveControlPanelSettings(
  data: ControlPanelSettingsData
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM control_panel_settings ORDER BY id ASC LIMIT 1"
  );

  const autoFlag = data.tenantRegistrationNumberAuto ? 1 : 0;

  const serialFlag = data.serialno ? 1 : 0;

  const nextNum =
    data.nextNumberTenant !== undefined &&
    data.nextNumberTenant !== null &&
    data.nextNumberTenant !== ""
      ? parseInt(String(data.nextNumberTenant), 10) || 1
      : null;

  const nextReceiptNum =
    data.nextNumberReceipt !== undefined &&
    data.nextNumberReceipt !== null &&
    data.nextNumberReceipt !== ""
      ? parseInt(String(data.nextNumberReceipt), 10) || 101
      : null;

  const startSerialNum =
    data.startSerialno !== undefined &&
    data.startSerialno !== null &&
    data.startSerialno !== ""
      ? parseInt(String(data.startSerialno), 10) || 1
      : 1;

  if (rows && rows.length > 0) {
    const id = rows[0].id;

    let query = `
      UPDATE control_panel_settings
      SET
        tenant_registration_number_auto = ?,
        serialno = ?,
        start_serialno = ?
    `;

    const params: any[] = [
      autoFlag,
      serialFlag,
      startSerialNum,
    ];

    if (nextNum !== null) {
      query += ", next_number_tenant = ?";
      params.push(nextNum);
    }

    if (nextReceiptNum !== null) {
      query += ", next_number_receipt = ?";
      params.push(nextReceiptNum);
    }

    query += " WHERE id = ?";
    params.push(id);

    const [result] = await pool.query<ResultSetHeader>(
      query,
      params
    );

    return result.affectedRows > 0;
  } else {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO control_panel_settings
      (
        id,
        tenant_registration_number_auto,
        next_number_tenant,
        next_number_receipt,
        serialno,
        start_serialno
      )
      VALUES (1, ?, ?, ?, ?, ?)`,
      [
        autoFlag,
        nextNum || 1,
        nextReceiptNum || 101,
        serialFlag,
        startSerialNum,
      ]
    );

    return result.affectedRows > 0;
  }
}

export async function checkTestTranDataAvailable(): Promise<boolean> {
  try {
    const sql = `
      SELECT EXISTS (
        SELECT 1
        FROM tbtesttran
        LIMIT 1
      ) AS dataavailable
    `;

    const [rows]: any = await pool.query(sql);

    return Boolean(rows[0]?.dataavailable);
  } catch (error) {
    console.error("Error checking tbtesttran data:", error);
    throw error;
  }
}