import { pool } from "../config/database";

export interface PatientTitleInput {
  patienttitle?: string;
  patientTitle?: string;
  datachanged?: number | boolean;
}

const SELECT_FIELDS = `
  patienttitleid AS patientTitleId,
  patienttitle AS patientTitle,
  datachanged AS datachanged
`;

function clean(data: PatientTitleInput) {
  const patientTitle = String(
    data.patienttitle ?? data.patientTitle ?? ""
  ).trim();

  if (!patientTitle) {
    throw new Error("Patient Title is required.");
  }

  if (patientTitle.length > 100) {
    throw new Error("Patient Title cannot exceed 100 characters.");
  }

  return { patientTitle };
}

// Check duplicate Patient Title
async function checkDuplicateTitle(
  patientTitle: string,
  excludeId?: number
): Promise<void> {
  let sql = `
    SELECT patienttitleid
    FROM tbpatienttitles
    WHERE LOWER(TRIM(patienttitle)) = LOWER(TRIM(?))
  `;

  const params: any[] = [patientTitle];

  // Edit karte waqt current record ko exclude karo
  if (excludeId !== undefined) {
    sql += ` AND patienttitleid <> ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;

  const [rows]: any = await pool.execute(sql, params);

  if (rows.length > 0) {
    throw new Error("Patient Title already exists.");
  }
}

// Get all Patient Titles
export async function getAll() {
  const [rows]: any = await pool.execute(`
    SELECT ${SELECT_FIELDS}
    FROM tbpatienttitles
    ORDER BY patienttitle
  `);

  return rows;
}

// Get Patient Title by ID
export async function getById(id: number) {
  const [rows]: any = await pool.execute(
    `
      SELECT ${SELECT_FIELDS}
      FROM tbpatienttitles
      WHERE patienttitleid = ?
    `,
    [id]
  );

  return rows[0] || null;
}

// Create Patient Title
export async function create(titleData: PatientTitleInput) {
  const title = clean(titleData);

  // Duplicate check before insert
  await checkDuplicateTitle(title.patientTitle);

  const [result]: any = await pool.execute(
    `
      INSERT INTO tbpatienttitles
        (patienttitle, datachanged)
      VALUES (?, ?)
    `,
    [title.patientTitle, 0]
  );

  return getById(Number(result.insertId));
}

// Update Patient Title
export async function update(
  id: number,
  titleData: PatientTitleInput
) {
  const title = clean(titleData);

  const existing = await getById(id);

  if (!existing) {
    return null;
  }

  // Current record ko exclude karke duplicate check
  await checkDuplicateTitle(title.patientTitle, id);

  await pool.execute(
    `
      UPDATE tbpatienttitles
      SET patienttitle = ?, datachanged = 1
      WHERE patienttitleid = ?
    `,
    [title.patientTitle, id]
  );

  return getById(id);
}


export async function remove(id: number) {
  // Check whether Patient Title is used in Test Master
  const [rows]: any = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM tbtesttran
      WHERE titleid = ?
    `,
    [id]
  );

  const total = Number(rows[0]?.total ?? 0);

  if (total > 0) {
    throw new Error(
      "This Patient Title cannot be deleted because it is already used in Test Master."
    );
  }

  // Delete Patient Title
  const [result]: any = await pool.execute(
    `
      DELETE FROM tbpatienttitles
      WHERE patienttitleid = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}
