import { pool } from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface TenantData {
  id?: number;
  regNo: string;
  regDate: string;
  name: string;
  address?: string | null;
  mobileNo: string;
  countryId?: number | null;
  stateId?: number | null;
  cityId?: number | null;
  identityProof?: string | null;
  identityProofNumber?: string | null;
  status?: string | null;
  nextOfKinName?: string | null;
  nextOfKinMobileNo?: string | null;
  nextOfKinAddress?: string | null;
}

export interface TenantFilterParams {
  propertyId?: number | string;
  buildingId?: number | string;
  unitId?: number | string;
  status?: string;
  searchField?: string;
  keyword?: string;
}

export async function getAllTenants(
  filters: TenantFilterParams = {},
): Promise<any[]> {
  let query = `
    SELECT 
      t.id,
      t.reg_no AS regNo,
      DATE_FORMAT(t.reg_date, '%Y-%m-%d') AS regDate,
      t.name,
      t.address,
      t.mobile_no AS mobileNo,
      t.country_id AS countryId,
      t.state_id AS stateId,
      t.city_id AS cityId,
      COALESCE(c.name, '') AS cityName,
      COALESCE(s.name, '') AS stateName,
      COALESCE(co.name, '') AS countryName,
      t.identity_proof AS identityProof,
      t.identity_proof_number AS identityProofNumber,
      t.status,
      t.next_of_kin_name AS nextOfKinName,
      t.next_of_kin_mobile_no AS nextOfKinMobileNo,
      t.next_of_kin_address AS nextOfKinAddress
    FROM tenants t
    LEFT JOIN cities c ON t.city_id = c.id
    LEFT JOIN states s ON t.state_id = s.id
    LEFT JOIN countries co ON t.country_id = co.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.status && filters.status !== "All") {
    query += ` AND t.status = ?`;
    params.push(filters.status);
  }

  if (filters.keyword && filters.keyword.trim()) {
    const kw = `%${filters.keyword.trim()}%`;
    if (filters.searchField === "name") {
      query += ` AND t.name LIKE ?`;
      params.push(kw);
    } else if (filters.searchField === "regNo") {
      query += ` AND t.reg_no = ?`;
      params.push(filters.keyword.trim());
    } else if (filters.searchField === "mobileNo") {
      query += ` AND t.mobile_no LIKE ?`;
      params.push(kw);
    } else if (filters.searchField === "identityProofNumber") {
      query += ` AND t.identity_proof_number LIKE ?`;
      params.push(kw);
    } else {
      query += ` AND (t.name LIKE ? OR t.reg_no LIKE ? OR t.mobile_no LIKE ? OR t.identity_proof_number LIKE ?)`;
      params.push(kw, kw, kw, kw);
    }
  }

  if (filters.unitId) {
    query += ` AND EXISTS (SELECT 1 FROM allotments a WHERE a.tenant_id = t.id AND a.unit_id = ?)`;
    params.push(Number(filters.unitId));
  } else if (filters.buildingId) {
    query += ` AND EXISTS (SELECT 1 FROM allotments a JOIN units u ON a.unit_id = u.id WHERE a.tenant_id = t.id AND u.building_id = ?)`;
    params.push(Number(filters.buildingId));
  } else if (filters.propertyId) {
    query += ` AND EXISTS (SELECT 1 FROM allotments a JOIN units u ON a.unit_id = u.id WHERE a.tenant_id = t.id AND u.property_id = ?)`;
    params.push(Number(filters.propertyId));
  }

  query += ` ORDER BY t.id DESC;`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows;
}

export async function getTenantById(id: number): Promise<any | null> {
  const query = `
    SELECT 
      t.id,
      t.reg_no AS regNo,
      DATE_FORMAT(t.reg_date, '%Y-%m-%d') AS regDate,
      t.name,
      t.address,
      t.mobile_no AS mobileNo,
      t.country_id AS countryId,
      t.state_id AS stateId,
      t.city_id AS cityId,
      COALESCE(c.name, '') AS cityName,
      COALESCE(s.name, '') AS stateName,
      COALESCE(co.name, '') AS countryName,
      t.identity_proof AS identityProof,
      t.identity_proof_number AS identityProofNumber,
      t.status,
      t.next_of_kin_name AS nextOfKinName,
      t.next_of_kin_mobile_no AS nextOfKinMobileNo,
      t.next_of_kin_address AS nextOfKinAddress
    FROM tenants t
    LEFT JOIN cities c ON t.city_id = c.id
    LEFT JOIN states s ON t.state_id = s.id
    LEFT JOIN countries co ON t.country_id = co.id
    WHERE t.id = ?;
  `;
  const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }
  const tenant = rows[0];

  let allotment: any = null;
  try {
    const [allotmentRows]: any = await pool.query(
      `SELECT a.*, u.unit_no AS unitNo, p.name AS propertyName, b.name AS buildingName
       FROM allotments a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON a.property_id = p.id
       JOIN buildings b ON a.building_id = b.id
       WHERE a.tenant_id = ?
       ORDER BY a.id DESC LIMIT 1`,
      [id],
    );
    if (allotmentRows && allotmentRows.length > 0) {
      allotment = allotmentRows[0];
    }
  } catch (e) {}

  return {
    ...tenant,
    allotment,
    ledger: [],
    securityLedger: [],
  };
}

export async function checkDuplicateRegNo(
  regNo: string,
  excludeId?: number,
): Promise<boolean> {
  let query = `SELECT id FROM tenants WHERE LOWER(TRIM(reg_no)) = LOWER(TRIM(?))`;
  const params: any[] = [regNo.trim()];
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

export async function checkTenantInUse(
  id: number,
): Promise<{ inUse: boolean; table?: string }> {
  const tablesToCheck = ["allotments", "rent_receipts", "payments"];
  for (const table of tablesToCheck) {
    try {
      const [rows]: any = await pool.query(
        `SELECT 1 FROM \`${table}\` WHERE tenant_id = ? LIMIT 1`,
        [id],
      );
      if (rows && rows.length > 0) {
        return { inUse: true, table };
      }
    } catch (e) {}
  }
  return { inUse: false };
}

export async function createTenant(data: TenantData): Promise<number> {
  const query = `
    INSERT INTO tenants (
      reg_no, reg_date, name, address, mobile_no,
      country_id, state_id, city_id,
      identity_proof, identity_proof_number,
      status, next_of_kin_name, next_of_kin_mobile_no, next_of_kin_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const values = [
    data.regNo,
    data.regDate,
    data.name,
    data.address ?? null,
    data.mobileNo,
    data.countryId ?? null,
    data.stateId ?? null,
    data.cityId ?? null,
    data.identityProof ?? "Driving License",
    data.identityProofNumber ?? null,
    data.status ?? "Active",
    data.nextOfKinName ?? null,
    data.nextOfKinMobileNo ?? null,
    data.nextOfKinAddress ?? null,
  ];
  const [result] = await pool.query<ResultSetHeader>(query, values);
  return result.insertId;
}

export async function updateTenant(
  id: number,
  data: TenantData,
): Promise<boolean> {
  const query = `
    UPDATE tenants
    SET 
      reg_no = ?,
      reg_date = ?,
      name = ?,
      address = ?,
      mobile_no = ?,
      country_id = ?,
      state_id = ?,
      city_id = ?,
      identity_proof = ?,
      identity_proof_number = ?,
      status = ?,
      next_of_kin_name = ?,
      next_of_kin_mobile_no = ?,
      next_of_kin_address = ?
    WHERE id = ?;
  `;
  const values = [
    data.regNo,
    data.regDate,
    data.name,
    data.address ?? null,
    data.mobileNo,
    data.countryId ?? null,
    data.stateId ?? null,
    data.cityId ?? null,
    data.identityProof ?? "Driving License",
    data.identityProofNumber ?? null,
    data.status ?? "Active",
    data.nextOfKinName ?? null,
    data.nextOfKinMobileNo ?? null,
    data.nextOfKinAddress ?? null,
    id,
  ];
  const [result] = await pool.query<ResultSetHeader>(query, values);
  return result.affectedRows > 0;
}

export async function deleteTenant(id: number): Promise<boolean> {
  const query = `DELETE FROM tenants WHERE id = ?;`;
  const [result] = await pool.query<ResultSetHeader>(query, [id]);
  return result.affectedRows > 0;
}

export interface TenantLedgerItem {
  date: string;
  particulars: string;
  receiptNo: string | null;
  dueAmount: number;
  receiptAmount: number;
  mode: string | null;
  sortOrder?: number;
}

export interface TenantLedgerResult {
  openingAmount: number;
  ledger: TenantLedgerItem[];
}

export async function getTenantLedgerData(
  tenantId: number,
  fromDate?: string,
  toDate?: string,
): Promise<TenantLedgerResult> {
  const start = fromDate ? fromDate.trim() : "2000-01-01";
  const end = toDate ? toDate.trim() : "2099-12-31";

  let openingDue = 0;
  let openingReceipt = 0;
  const ledgerItems: TenantLedgerItem[] = [];

  //  Fetch Allotments for this tenant
  const [allotmentRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       id, 
       charges, 
       DATE_FORMAT(date, '%Y-%m-%d') AS date,
       DATE_FORMAT(allotment_from, '%Y-%m-%d') AS allotmentFrom,
       DATE_FORMAT(allotment_to, '%Y-%m-%d') AS allotmentTo,
       status
     FROM allotments
     WHERE tenant_id = ?
     ORDER BY allotment_from ASC, id ASC`,
    [tenantId],
  );

  // Generate monthly due dates for each allotment
  for (const allotment of allotmentRows) {
    const [chargesRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         service_name AS serviceName,
         type,
         charge_amount AS chargeAmount
       FROM allotment_service_charges
       WHERE allotment_id = ?`,
      [allotment.id],
    );

    let monthlyAdditional = 0;
    let oneTimeAdditional = 0;
    for (const c of chargesRows) {
      const amt = Number(c.chargeAmount) || 0;
      if (c.type === "Monthly") {
        monthlyAdditional += amt;
      } else if (c.type === "One Time") {
        oneTimeAdditional += amt;
      }
    }

    const baseRent = Number(allotment.charges) || 0;
    const monthlyTotal = baseRent + monthlyAdditional;

    const fromDateStr = allotment.allotmentFrom || allotment.date;
    const toDateStr = allotment.allotmentTo;

    if (fromDateStr && toDateStr) {
      const fromParts = fromDateStr
        .split("-")
        .map((p: string) => parseInt(p, 10));
      const toParts = toDateStr.split("-").map((p: string) => parseInt(p, 10));

      const startYear = fromParts[0];
      const startMonth = fromParts[1] - 1; // 0-indexed
      const startDay = fromParts[2] || 1;
      const endYear = toParts[0];
      const endMonth = toParts[1] - 1;

      let totalMonths =
        (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      if (totalMonths <= 0) totalMonths = 1;
      totalMonths = Math.min(totalMonths, 120);

      for (let i = 0; i < totalMonths; i++) {
        const curYear = startYear + Math.floor((startMonth + i) / 12);
        const curMonth = (startMonth + i) % 12;
        const maxDays = new Date(curYear, curMonth + 1, 0).getDate();
        const targetDay = Math.min(startDay, maxDays);
        const yyyy = curYear;
        const mm = String(curMonth + 1).padStart(2, "0");
        const dd = String(targetDay).padStart(2, "0");
        const dueDate = `${yyyy}-${mm}-${dd}`;

        if (toDateStr && dueDate > toDateStr) {
          break;
        }

        let dueAmt = monthlyTotal;
        if (i === 0) {
          dueAmt += oneTimeAdditional;
        }

        if (dueAmt > 0) {
          if (dueDate < start) {
            openingDue += dueAmt;
          } else if (dueDate >= start && dueDate <= end) {
            ledgerItems.push({
              date: dueDate,
              particulars: "Due Amt.",
              receiptNo: null,
              dueAmount: Number(dueAmt.toFixed(2)),
              receiptAmount: 0,
              mode: null,
              sortOrder: 1,
            });
          }
        }
      }
    }
  }

  // Fetch all rent receipts for this tenant
  const [receiptRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       id,
       receipt_no AS receiptNo,
       DATE_FORMAT(receipt_date, '%Y-%m-%d') AS receiptDate,
       COALESCE(receipt_mode, 'Cash') AS receiptMode,
       received_amount AS receivedAmount
     FROM rent_receipts
     WHERE tenant_id = ?
     ORDER BY receipt_date ASC, id ASC`,
    [tenantId],
  );

  for (const r of receiptRows) {
    const rcptDate = r.receiptDate;
    const rcptAmt = Number(r.receivedAmount) || 0;
    const rcptNo = r.receiptNo
      ? String(r.receiptNo).toLowerCase().startsWith("rcpt")
        ? String(r.receiptNo)
        : `Rcpt No. ${r.receiptNo}`
      : "";

    if (rcptDate < start) {
      openingReceipt += rcptAmt;
    } else if (rcptDate >= start && rcptDate <= end) {
      ledgerItems.push({
        date: rcptDate,
        particulars: "Rcvd Amt.",
        receiptNo: rcptNo,
        dueAmount: 0,
        receiptAmount: Number(rcptAmt.toFixed(2)),
        mode: r.receiptMode,
        sortOrder: 2,
      });
    }
  }

  //  Opening Amount = Opening Due - Opening Receipt
  const openingAmount = Number((openingDue - openingReceipt).toFixed(2));

  //  Sort transactions chronologically by date, dues before receipts on same date
  ledgerItems.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return (a.sortOrder || 1) - (b.sortOrder || 2);
  });

  return {
    openingAmount,
    ledger: ledgerItems,
  };
}
