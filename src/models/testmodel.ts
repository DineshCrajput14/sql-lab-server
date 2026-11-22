
import { pool } from "../config/database";

export interface TestInput {
  testName?: string;
  testname?: string;

  testPrice?: number | string | null;
  testprice?: number | string | null;

  normalValueM?: string | null;
  normalvaluem?: string | null;
  normalValueF?: string | null;
  normalvaluef?: string | null;

  normalMinM?: number | string | null;
  normalminm?: number | string | null;
  normalMaxM?: number | string | null;
  normalmaxm?: number | string | null;

  normalMinF?: number | string | null;
  normalminf?: number | string | null;
  normalMaxF?: number | string | null;
  normalmaxf?: number | string | null;

  normalUnitM?: string | null;
  normalunitm?: string | null;
  normalUnitF?: string | null;
  normalunitf?: string | null;

  groupId?: number | string;
  groupid?: number | string;

  prnBold?: number | boolean;
  prnbold?: number | boolean;

  orderNo?: number | string;
  orderno?: number | string;

  datachanged?: number | boolean;

  disabledInNewTran?: number | boolean;
  disabledinnewtran?: number | boolean;
}

const SELECT_FIELDS = `
  tm.testid AS testId,
  tm.testname AS testName,
  tm.testprice AS testPrice,
  tm.normalvaluem AS normalValueM,
  tm.normalvaluef AS normalValueF,
  tm.normalminm AS normalMinM,
  tm.normalmaxm AS normalMaxM,
  tm.normalminf AS normalMinF,
  tm.normalmaxf AS normalMaxF,
  tm.normalunitm AS normalUnitM,
  tm.normalunitf AS normalUnitF,
  tm.groupid AS groupId,
  gm.groupname AS groupName,
  tm.prnbold AS prnBold,
  tm.orderno AS orderNo,
  tm.datachanged AS datachanged,
  tm.disabledinnewtran AS disabledInNewTran
`;

function toNumberOrNull(value: any): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error("Normal range must contain valid numbers");
  }

  return numberValue;
}

function toTestPrice(value: any): number {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error("Test Price must contain a valid number");
  }

  if (numberValue < 0) {
    throw new Error("Test Price cannot be negative");
  }

  return numberValue;
}

function toFlag(value: any, defaultValue = 0): number {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return value === true || value === 1 || value === "1" ? 1 : 0;
}

function formatNumber(value: number): string {
  return String(value);
}

function makeRange(
  min: number | null,
  max: number | null,
  unit: string | null
): string | null {
  const formattedUnit = (unit ?? "").trim();

  let range: string | null = null;

  if (min === null && max === null) {
    range = null;
  } else if (min === null) {
    range = formatNumber(max as number);
  } else if (max === null) {
    range = formatNumber(min);
  } else {
    if (min > max) {
      throw new Error(
        "Minimum normal value cannot be greater than maximum normal value"
      );
    }

    range = `${formatNumber(min)} - ${formatNumber(max)}`;
  }

  if (range && formattedUnit) {
    return `${range} / ${formattedUnit}`;
  }

  if (range) {
    return range;
  }

  return formattedUnit ? `/ ${formattedUnit}` : null;
}

async function validateDuplicateTestName(
  testName: string,
  id?: number
): Promise<void> {
  if (!testName) {
    throw new Error("Test name is required");
  }

  let query = `
    SELECT testid
    FROM tbtestmaster
    WHERE LOWER(TRIM(testname)) = LOWER(TRIM(?))
  `;

  const params: any[] = [testName];

  if (id !== undefined) {
    query += ` AND testid <> ?`;
    params.push(id);
  }

  query += ` LIMIT 1`;

  const [rows]: any = await pool.execute(query, params);

  if (rows.length > 0) {
    throw new Error(
      `Test Name "${testName}" already exists. Please enter a different Test Name.`
    );
  }
}

function clean(d: TestInput) {
  const testName = String(d.testName ?? d.testname ?? "").trim();

  const testPrice = toTestPrice(
    d.testPrice ?? d.testprice
  );

  const normalMinM = toNumberOrNull(
    d.normalMinM ?? d.normalminm
  );

  const normalMaxM = toNumberOrNull(
    d.normalMaxM ?? d.normalmaxm
  );

  const normalMinF = toNumberOrNull(
    d.normalMinF ?? d.normalminf
  );

  const normalMaxF = toNumberOrNull(
    d.normalMaxF ?? d.normalmaxf
  );

  const normalUnitM = String(
    d.normalUnitM ?? d.normalunitm ?? ""
  ).trim();

  const normalUnitF = String(
    d.normalUnitF ?? d.normalunitf ?? ""
  ).trim();

  const normalValueM = makeRange(
    normalMinM,
    normalMaxM,
    normalUnitM
  );

  const normalValueF = makeRange(
    normalMinF,
    normalMaxF,
    normalUnitF
  );

  const groupId = Number(d.groupId ?? d.groupid ?? 0);
  const orderNo = Number(d.orderNo ?? d.orderno ?? 0);

  if (!Number.isInteger(groupId) || groupId < 0) {
    throw new Error("Invalid Test Group");
  }

  if (!Number.isInteger(orderNo) || orderNo < 0) {
    throw new Error("Invalid Order No");
  }

  return {
    testName,
    testPrice,
    normalValueM,
    normalValueF,
    normalMinM,
    normalMaxM,
    normalMinF,
    normalMaxF,
    normalUnitM: normalUnitM || null,
    normalUnitF: normalUnitF || null,
    groupId,
    prnBold: toFlag(d.prnBold ?? d.prnbold),
    orderNo,
    datachanged: toFlag(d.datachanged),
    disabledInNewTran: toFlag(
      d.disabledInNewTran ?? d.disabledinnewtran
    ),
  };
}

export async function getAll() {
  const [rows]: any = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM tbtestmaster tm
     LEFT JOIN tbgroupmaster gm
       ON tm.groupid = gm.groupId
     ORDER BY gm.groupId,tm.orderno, tm.testname`
  );

  return rows;
}

export async function getById(id: number) {
  const [rows]: any = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM tbtestmaster tm
     LEFT JOIN tbgroupmaster gm
       ON tm.groupid = gm.groupId
     WHERE tm.testid = ?`,
    [id]
  );

  return rows[0] || null;
}

export async function create(testData: TestInput) {
  const t = clean(testData);

  if (!t.testName) {
    throw new Error("Test name is required");
  }

  // Duplicate Test Name validation
  await validateDuplicateTestName(t.testName);

  const [result]: any = await pool.execute(
    `INSERT INTO tbtestmaster
    (
      testname,
      testprice,
      normalvaluem,
      normalvaluef,
      normalminm,
      normalmaxm,
      normalminf,
      normalmaxf,
      normalunitm,
      normalunitf,
      groupid,
      prnbold,
      orderno,
      datachanged,
      disabledinnewtran
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t.testName,
      t.testPrice,
      t.normalValueM,
      t.normalValueF,
      t.normalMinM,
      t.normalMaxM,
      t.normalMinF,
      t.normalMaxF,
      t.normalUnitM,
      t.normalUnitF,
      t.groupId,
      t.prnBold,
      t.orderNo,
      t.datachanged,
      t.disabledInNewTran,
    ]
  );

  return getById(Number(result.insertId));
}

export async function update(id: number, testData: TestInput) {
  const t = clean(testData);

  if (!t.testName) {
    throw new Error("Test name is required");
  }

  // Duplicate Test Name validation (exclude current record)
  await validateDuplicateTestName(t.testName, id);

  const [result]: any = await pool.execute(
    `UPDATE tbtestmaster
     SET
       testname = ?,
       testprice = ?,
       normalvaluem = ?,
       normalvaluef = ?,
       normalminm = ?,
       normalmaxm = ?,
       normalminf = ?,
       normalmaxf = ?,
       normalunitm = ?,
       normalunitf = ?,
       groupid = ?,
       prnbold = ?,
       orderno = ?,
       datachanged = 1,
       disabledinnewtran = ?
     WHERE testid = ?`,
    [
      t.testName,
      t.testPrice,
      t.normalValueM,
      t.normalValueF,
      t.normalMinM,
      t.normalMaxM,
      t.normalMinF,
      t.normalMaxF,
      t.normalUnitM,
      t.normalUnitF,
      t.groupId,
      t.prnBold,
      t.orderNo,
      t.disabledInNewTran,
      id,
    ]
  );

  if (result.affectedRows === 0) {
    const existing = await getById(id);

    if (!existing) {
      return null;
    }
  }

  return getById(id);
}

export async function remove(id: number) {
  const [rows]: any = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM tbtesttrandetail
      WHERE testid = ?
    `,
    [id]
  );

  const total = Number(rows[0]?.total ?? 0);

  if (total > 0) {
    throw new Error(
      "This Test cannot be deleted because it is already used in Lab Test Transactions."
    );
  }

  const [result]: any = await pool.execute(
    `
      DELETE FROM tbtestmaster
      WHERE testid = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}
