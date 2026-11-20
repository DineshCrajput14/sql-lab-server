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
    LIMIT 1`,
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
        rows[0].tenant_registration_number_auto,
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
  data: ControlPanelSettingsData,
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM control_panel_settings ORDER BY id ASC LIMIT 1",
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

    const params: any[] = [autoFlag, serialFlag, startSerialNum];

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

    const [result] = await pool.query<ResultSetHeader>(query, params);

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
      ],
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

// GET NEXT TENANT REGISTRATION NUMBER AND INCREMENT
export async function getNextTenantNumberAndIncrement(
  usedNumber?: number | string,
): Promise<string> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = (await connection.query(
      `SELECT id, next_number_receipt
   FROM control_panel_settings
   LIMIT 1
   FOR UPDATE`,
    )) as [RowDataPacket[], any];

    if (!rows || rows.length === 0) {
      const nextNumber = 1;

      await connection.query(
        `INSERT INTO control_panel_settings
         (id, tenant_registration_number_auto, next_number_tenant,
          next_number_receipt, serialno, start_serialno)
         VALUES (1, 1, 2, 101, 0, 1)`,
      );

      await connection.commit();

      return String(nextNumber);
    }

    const id = rows[0].id;
    const currentNumber = Number(rows[0].next_number_tenant) || 1;

    // Manual registration number entered:
    // keep the next counter ahead of the manually used number.
    if (usedNumber !== undefined && usedNumber !== null && usedNumber !== "") {
      const manualNumber = parseInt(String(usedNumber), 10);

      if (!isNaN(manualNumber) && manualNumber >= currentNumber) {
        await connection.query(
          `UPDATE control_panel_settings
           SET next_number_tenant = ?
           WHERE id = ?`,
          [manualNumber + 1, id],
        );
      }

      await connection.commit();
      return String(usedNumber);
    }

    // Auto number: take current and increment.
    await connection.query(
      `UPDATE control_panel_settings
       SET next_number_tenant = ?
       WHERE id = ?`,
      [currentNumber + 1, id],
    );

    await connection.commit();

    return String(currentNumber);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// GET NEXT RECEIPT NUMBER AND INCREMENT
export async function getNextReceiptNumberAndIncrement(
  externalConnection?: any,
  usedNumber?: number | string,
): Promise<string> {
  const connection = externalConnection || (await pool.getConnection());
  const ownConnection = !externalConnection;

  try {
    if (ownConnection) {
      await connection.beginTransaction();
    }

    const [rows] = (await connection.query(
      `SELECT id, next_number_receipt
   FROM control_panel_settings
   LIMIT 1
   FOR UPDATE`,
    )) as [RowDataPacket[], any];

    if (!rows || rows.length === 0) {
      const nextNumber = 101;

      await connection.query(
        `INSERT INTO control_panel_settings
         (id, tenant_registration_number_auto, next_number_tenant,
          next_number_receipt, serialno, start_serialno)
         VALUES (1, 1, 1, 102, 0, 1)`,
      );

      if (ownConnection) {
        await connection.commit();
      }

      return String(nextNumber);
    }

    const id = rows[0].id;
    const currentNumber = Number(rows[0].next_number_receipt) || 101;

    // Manual receipt number: synchronize next counter.
    if (usedNumber !== undefined && usedNumber !== null && usedNumber !== "") {
      const manualNumber = parseInt(String(usedNumber), 10);

      if (!isNaN(manualNumber) && manualNumber >= currentNumber) {
        await connection.query(
          `UPDATE control_panel_settings
           SET next_number_receipt = ?
           WHERE id = ?`,
          [manualNumber + 1, id],
        );
      }

      if (ownConnection) {
        await connection.commit();
      }

      return String(usedNumber);
    }

    // Auto receipt number: use current and increment.
    await connection.query(
      `UPDATE control_panel_settings
       SET next_number_receipt = ?
       WHERE id = ?`,
      [currentNumber + 1, id],
    );

    if (ownConnection) {
      await connection.commit();
    }

    return String(currentNumber);
  } catch (error) {
    if (ownConnection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (ownConnection) {
      connection.release();
    }
  }
}
