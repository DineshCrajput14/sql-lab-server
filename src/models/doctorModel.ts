import { pool } from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface DoctorInput {
  doctorName?: string;
  name?: string;
  pAddress?: string;
  cAddress?: string;
  phone?: string;
  emailId?: string;
  commissionPvalue?: number | string;
}

const SELECT_FIELDS = `
  doctorid        AS doctorId,
  doctorname      AS doctorName,
  paddress        AS pAddress,
  caddress        AS cAddress,
  phone           AS phone,
  emailid         AS emailId,
  commissionpvalue AS commissionPvalue
`;

function clean(d: DoctorInput) {
  return {
    doctorName: String(d.doctorName || d.name || "").trim(),
    pAddress: String(d.pAddress || "").trim(),
    cAddress: String(d.cAddress || "").trim(),
    phone: String(d.phone || "").trim(),
    emailId: String(d.emailId || "").trim(),
    commissionPvalue: Number(d.commissionPvalue || 0),
  };
}

export async function getAll() {
  const [rows]: any = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM tbdoctormaster ORDER BY doctorname`,
  );
  return rows;
}

export async function getById(id: number) {
  const [rows]: any = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM tbdoctormaster WHERE doctorid = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function create(doctorData: DoctorInput) {
  const d = clean(doctorData);
  if (!d.doctorName) throw new Error("Doctor name is required");

  const [result]: any = await pool.execute(
    `INSERT INTO tbdoctormaster
       (doctorname, paddress, caddress, phone, emailid, commissionpvalue)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [d.doctorName, d.pAddress || null, d.cAddress || null, d.phone || null, d.emailId || null, d.commissionPvalue],
  );

  return { doctorId: Number(result.insertId), ...d };
}

export async function update(id: number, doctorData: DoctorInput) {
  const d = clean(doctorData);
  if (!d.doctorName) throw new Error("Doctor name is required");
  const [result]: any = await pool.execute(
    `UPDATE tbdoctormaster
        SET doctorname = ?, paddress = ?, caddress = ?, phone = ?, emailid = ?, commissionpvalue = ?
      WHERE doctorid = ?`,
    [d.doctorName, d.pAddress || null, d.cAddress || null, d.phone || null, d.emailId || null, d.commissionPvalue, id],
  );

  if (result.affectedRows === 0) return null;
  return { doctorId: id, ...d };
  console.log("UPDATE RESULT:", result);
}

export async function remove(id: number) {
  // First check whether doctor is used in Lab Test transactions
  const [rows]: any = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM tbtesttran
     WHERE refdoctor = ?`,
    [id]
  );

  const total = Number(rows[0]?.total ?? 0);

  if (total > 0) {
    throw new Error(
      "This doctor cannot be deleted because it is already used in Lab Test transactions."
    );
  }

  // Doctor is not used, so delete it
  const [result]: any = await pool.execute(
    `DELETE FROM tbdoctormaster
     WHERE doctorid = ?`,
    [id]
  );

  return result.affectedRows > 0;
}