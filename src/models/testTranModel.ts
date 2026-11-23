import { pool } from "../config/database";

export interface TestTranDetailInput {
  masterId?: number | string | null;
  masterid?: number | string | null;
  groupId?: number | string | null;
  groupid?: number | string | null;
  testId?: number | string | null;
  testid?: number | string | null;
  testValue?: string | null;
  testvalue?: string | null;
}


export interface WidalTestInput {
  wtestid?: number | string | null;
  WTestId?: number | string | null;

  dilution1?: string | null;
  dilution2?: string | null;
  dilution3?: string | null;
  dilution4?: string | null;
  dilution5?: string | null;
  dilution6?: string | null;
}
export interface TestTranInput {
  patientName?: string;
  patientname?: string;
  fhName?: string;
  fhname?: string;
  age?: string;
  gender?: string;
  refDoctor?: string;
  refdoctor?: string;
  date?: string | null;
  testDate?: string | null;
  widalTest?: boolean | number;
  widaltest?: boolean | number;
  serialNo?: number | string | null;
  serialno?: number | string | null;
  printout?: boolean | number;
  sampleDrawnBy?: string | null;
  sampledrawnby?: string | null;
  sampleName?: string | null;
  samplename?: string | null;
  reportNumber?: string | null;
  reportnumber?: string | null;
  sampleDrawnOn?: string | null;
  sampledrawnon?: string | null;
  sampleReceivedOn?: string | null;
  samplereceivedon?: string | null;

  reportDate?: string | null;
  reportdate?: string | null;
  reportStatus?: boolean | number | string;
  reportstatus?: boolean | number | string;
  finalPayment?: boolean | number | string;
  finalpayment?: boolean | number | string;

  ageTime?: string | null;
  agetime?: string | null;
  vdrlTest?: boolean | number;
  vdrltest?: boolean | number;
  raTest?: boolean | number;
  ratest?: boolean | number;
  amount?: number | string;

  testtotal?: number | string | null;
  testTotal?: number | string | null;
  wtestvalue?: number | string | null;
  wtestValue?: number | string | null;
  discp?: number | string | null;
  discAmount?: number | string | null;
  discamount?: number | string | null;

  address1?: string | null;
  address2?: string | null;

  titleId?: number | string | null;
  titleid?: number | string | null;
  datachanged?: string | null;
  passwordtext?: string | null;
  uploadonserver?: boolean | number;
  emailid?: string | null;
  sno?: number | string | null;
  regno?: string | null;
  labno?: string | null;
  commissionP?: number | string;
  commisionp?: number | string;
  commissionValue?: number | string;
  commisionvalue?: number | string;

  details?: TestTranDetailInput[];
  tests?: TestTranDetailInput[];

  widalMethodId?: number | string | null;
widalmethodid?: number | string | null;

widalResultId?: number | string | null;
widalresultid?: number | string | null;

widalTests?: WidalTestInput[];
widaltests?: WidalTestInput[];
widalValues?: WidalTestInput[];
}

const SELECT_FIELDS = `
  tbtesttran.testtranid,
  tbtesttran.patientname,
  tbtesttran.fhname,
  tbtesttran.age,
  tbtesttran.gender,
  tbtesttran.refdoctor,
  tbtesttran.date,
  tbtesttran.widaltest,
  tbtesttran.serialno,
  tbtesttran.printout,
  tbtesttran.sampledrawnby,
  tbtesttran.samplename,
  tbtesttran.reportnumber,
  tbtesttran.sampledrawnon,
  tbtesttran.samplereceivedon,

  tbtesttran.reportdate,
  tbtesttran.reportstatus,
  tbtesttran.finalpayment,

  tbtesttran.agetime,
  tbtesttran.vdrltest,
  tbtesttran.ratest,
  tbtesttran.amount,

  tbtesttran.testtotal,
  tbtesttran.wtestvalue,
  tbtesttran.discp,
  tbtesttran.discAmount,

  tbtesttran.address1,
  tbtesttran.address2,

  tbtesttran.printingcount,
  tbtesttran.titleid,
  tbtesttran.datachanged,
  tbtesttran.passwordtext,
  tbtesttran.uploadonserver,
  tbtesttran.emailid,
  tbtesttran.sno,
  tbtesttran.regno,
  tbtesttran.labno,
  tbtesttran.commisionp,
  tbtesttran.commisionvalue
`;

function toFlag(value: any, defaultValue = 0): number {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return value === true || value === 1 || value === "1" ? 1 : 0;
}

function toMySQLDateTime(value: any): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const dateString = String(value).trim().replace("T", " ");

  if (dateString.length === 16) {
    return `${dateString}:00`;
  }

  if (dateString.length === 10) {
    return `${dateString} 00:00:00`;
  }

  return dateString;
}

function toNumberOrNull(value: any): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error("Invalid numeric value");
  }

  return numberValue;
}

function cleanDetails(input: TestTranInput): TestTranDetailInput[] {
  const details = input.details ?? input.tests ?? [];

  if (!Array.isArray(details)) {
    throw new Error("Test details must be an array");
  }

  return details.map((item) => {
    const testId = toNumberOrNull(item.testId ?? item.testid);
    const groupId = toNumberOrNull(item.groupId ?? item.groupid);
    const masterId = toNumberOrNull(item.masterId ?? item.masterid);
    const testValue = item.testValue ?? item.testvalue ?? null;

    if (testId === null || !Number.isInteger(testId) || testId <= 0) {
      throw new Error("Every test detail must have a valid testId");
    }

    return {
      testId,
      groupId,
      masterId,
      testValue:
        testValue === null || testValue === undefined
          ? null
          : String(testValue),
    };
  });
}

function cleanMain(input: TestTranInput) {
  const patientName = String(
    input.patientName ?? input.patientname ?? ""
  ).trim();

  if (!patientName) {
    throw new Error("Patient name is required");
  }

  const reportStatus = toFlag(
    input.reportStatus ?? input.reportstatus
  );

  return {
    patientname: patientName,
    fhname: input.fhName ?? input.fhname ?? null,
    age: input.age ?? null,
    gender: input.gender ?? null,
    refdoctor: input.refDoctor ?? input.refdoctor ?? null,
    date: input.testDate ?? input.date ?? null,
    widaltest: toFlag(input.widalTest ?? input.widaltest),
    printout: toFlag(input.printout),

    sampledrawnby: input.sampleDrawnBy ?? input.sampledrawnby ?? null,
    samplename: input.sampleName ?? input.samplename ?? null,
    reportnumber: input.reportNumber ?? input.reportnumber ?? null,
    sampledrawnon: input.sampleDrawnOn ?? input.sampledrawnon ?? null,

    samplereceivedon: toMySQLDateTime(
      input.sampleReceivedOn ?? input.samplereceivedon
    ),

    reportdate: toMySQLDateTime(
      input.reportDate ?? input.reportdate
    ),

    reportstatus: reportStatus,

    // Final payment is inserted only during CREATE.
    finalpayment: toFlag(
      input.finalPayment ?? input.finalpayment,
      0
    ),

    agetime: input.ageTime ?? input.agetime ?? null,
    vdrltest: toFlag(input.vdrlTest ?? input.vdrltest),
    ratest: toFlag(input.raTest ?? input.ratest),
    amount: toNumberOrNull(input.amount) ?? 0,

    testtotal:
      toNumberOrNull(input.testtotal ?? input.testTotal) ?? 0,

    wtestvalue:
      toNumberOrNull(input.wtestvalue ?? input.wtestValue) ?? 0,

    discp: toNumberOrNull(input.discp) ?? 0,

    discAmount:
      toNumberOrNull(input.discAmount ?? input.discamount) ?? 0,

    address1: input.address1 ?? null,

    // IMPORTANT: Only address2 is used.
    address2: input.address2 ?? null,

    titleid: toNumberOrNull(input.titleId ?? input.titleid),
    datachanged: input.datachanged ?? null,
    passwordtext: input.passwordtext ?? null,
    uploadonserver: toFlag(input.uploadonserver),
    emailid: input.emailid ?? null,
    sno: toNumberOrNull(input.sno),
    regno: input.regno ?? null,
    labno: input.labno ?? null,

    commisionp:
      toNumberOrNull(input.commissionP ?? input.commisionp) ?? 0,

    commisionvalue:
      toNumberOrNull(input.commissionValue ?? input.commisionvalue) ?? 0,
  };
}

async function insertDetails(
  connection: any,
  testTranId: number,
  details: TestTranDetailInput[]
) {
  for (const detail of details) {
    await connection.execute(
      `INSERT INTO tbtesttrandetail
       (masterid, groupid, testid, testvalue, datachanged)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        testTranId,
        detail.groupId ?? detail.groupid ?? null,
        detail.testId ?? detail.testid ?? null,
        detail.testValue ?? detail.testvalue ?? "",
      ]
    );
  }
}
export async function getAll() {
  const [rows]: any = await pool.execute(
    `SELECT
        ${SELECT_FIELDS},
        d.doctorname AS refdoctorname
     FROM tbtesttran
     LEFT JOIN tbdoctormaster d
        ON tbtesttran.refdoctor = d.doctorid
     ORDER BY tbtesttran.date DESC, tbtesttran.testtranid DESC`
  );

  return rows;
}

export async function getById(id: number) {
  const [rows]: any = await pool.execute(
    `SELECT
        ${SELECT_FIELDS},
        d.doctorname AS refdoctorname
     FROM tbtesttran
     LEFT JOIN tbdoctormaster d
        ON tbtesttran.refdoctor = d.doctorid
     WHERE tbtesttran.testtranid = ?`,
    [id]
  );

  return rows[0] || null;
}

export async function getDetails(testtranid: number) {
  const [rows]: any = await pool.execute(
    `SELECT
       d.testtranid,
       d.masterid,
       d.groupid,
       g.groupname,
       d.testid,
       t.testname,
       t.normalvaluem,
       t.normalvaluef,
       t.normalminm,
       t.normalmaxm,
       t.normalminf,
       t.normalmaxf,
       t.normalunitm,
       t.normalunitf,
       d.testvalue,
       d.datachanged
     FROM tbtesttrandetail d
     LEFT JOIN tbtestmaster t
       ON d.testid = t.testid
     LEFT JOIN tbgroupmaster g
       ON d.groupid = g.groupid
     WHERE d.masterid = ?
     ORDER BY g.groupid, t.orderno, t.testname`,
    [testtranid]
  );

  return rows;
}

export async function create(input: TestTranInput) {
  const main = cleanMain(input);
  const details = cleanDetails(input);
  const connection = await pool.getConnection();

  let lockAcquired = false;
  let testTranId = 0;

  try {
    await connection.beginTransaction();

    const [lockResult]: any = await connection.execute(
      `SELECT GET_LOCK('tbtesttran_reference_lock', 10) AS lockStatus`
    );

    if (Number(lockResult[0]?.lockStatus) !== 1) {
      throw new Error(
        "Unable to generate Reference Number. Please try again."
      );
    }

    lockAcquired = true;

    const [serialRows]: any = await connection.execute(
      `SELECT COALESCE(MAX(serialno), 0) AS lastSerialNo
       FROM tbtesttran`
    );

    const lastSerialNo = Number(serialRows[0]?.lastSerialNo || 0);
    const nextReferenceNo = lastSerialNo + 1;

    const [result]: any = await connection.execute(
      `INSERT INTO tbtesttran (
        patientname,
        fhname,
        age,
        gender,
        refdoctor,
        date,
        widaltest,
        serialno,
        printout,
        sampledrawnby,
        samplename,
        reportnumber,
        sampledrawnon,
        samplereceivedon,

        reportdate,
        reportstatus,
        finalpayment,

        agetime,
        vdrltest,
        ratest,
        amount,

        testtotal,
        wtestvalue,
        discp,
        discAmount,

        address1,
        address2,
        titleid,
        datachanged,
        passwordtext,
        uploadonserver,
        emailid,
        sno,
        regno,
        labno,
        commisionp,
        commisionvalue
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        main.patientname,
        main.fhname,
        main.age,
        main.gender,
        main.refdoctor,
        main.date,
        main.widaltest,
        nextReferenceNo,
        main.printout,
        main.sampledrawnby,
        main.samplename,
        main.reportnumber,
        main.sampledrawnon,
        main.samplereceivedon,

        main.reportdate,
        main.reportstatus,
        main.finalpayment,

        main.agetime,
        main.vdrltest,
        main.ratest,
        main.amount,

        main.testtotal,
        main.wtestvalue,
        main.discp,
        main.discAmount,

        main.address1,
        main.address2,
        main.titleid,
        main.datachanged,
        main.passwordtext,
        main.uploadonserver,
        main.emailid,
        main.sno,
        main.regno,
        main.labno,
        main.commisionp,
        main.commisionvalue,
      ]
    );

    testTranId = Number(result.insertId);

    await insertDetails(connection, testTranId, details);
    await saveWidalData(
  connection,
  testTranId,
  input,
  main.widaltest
);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (lockAcquired) {
      await connection.execute(
        `SELECT RELEASE_LOCK('tbtesttran_reference_lock')`
      );
    }

    connection.release();
  }

  return getById(testTranId);
}

export async function getNextReferenceNo(): Promise<number> {
  const [rows]: any = await pool.execute(
    `SELECT COALESCE(MAX(serialno), 0) + 1 AS nextReferenceNo
     FROM tbtesttran`
  );

  return Number(rows[0]?.nextReferenceNo || 1);
}

// UPDATE PATIENT
export async function update(id: number, input: TestTranInput) {
  const main = cleanMain(input);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result]: any = await connection.execute(
      `UPDATE tbtesttran
       SET
         patientname = ?,
         fhname = ?,
         age = ?,
         gender = ?,
         refdoctor = ?,
         date = ?,
         widaltest = ?,
         printout = ?,
         sampledrawnby = ?,
         samplename = ?,
         reportnumber = ?,
         sampledrawnon = ?,
         samplereceivedon = ?,

         reportdate = ?,
         reportstatus = ?,

         agetime = ?,
         vdrltest = ?,
         ratest = ?,
         amount = ?,

         testtotal = ?,
         wtestvalue = ?,
         discp = ?,
         discAmount = ?,

         address1 = ?,
         address2 = ?,
         titleid = ?,
         datachanged = NOW(),
         passwordtext = ?,
         uploadonserver = ?,
         emailid = ?,
         sno = ?,
         regno = ?,
         labno = ?,
         commisionp = ?,
         commisionvalue = ?
       WHERE testtranid = ?`,
      [
        main.patientname,
        main.fhname,
        main.age,
        main.gender,
        main.refdoctor,
        main.date,
        main.widaltest,
        main.printout,
        main.sampledrawnby,
        main.samplename,
        main.reportnumber,
        main.sampledrawnon,
        main.samplereceivedon,

        main.reportdate,
        main.reportstatus,

        main.agetime,
        main.vdrltest,
        main.ratest,
        main.amount,

        main.testtotal,
        main.wtestvalue,
        main.discp,
        main.discAmount,

        main.address1,
        main.address2,
        main.titleid,
        main.passwordtext,
        main.uploadonserver,
        main.emailid,
        main.sno,
        main.regno,
        main.labno,
        main.commisionp,
        main.commisionvalue,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      const [existing]: any = await connection.execute(
        `SELECT testtranid
         FROM tbtesttran
         WHERE testtranid = ?`,
        [id]
      );

      if (!existing.length) {
        await connection.rollback();
        return null;
      }
    }

    // Reference Number is NOT changed during edit.
    // finalpayment is NOT updated during edit.

    if (input.details !== undefined || input.tests !== undefined) {
      const details = cleanDetails(input);

      await connection.execute(
        `DELETE FROM tbtesttrandetail
         WHERE masterid = ?`,
        [id]
      );

      await insertDetails(connection, id, details);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getById(id);
}

// DELETE PATIENT
export async function remove(id: number) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing]: any = await connection.execute(
      `SELECT testtranid
       FROM tbtesttran
       WHERE testtranid = ?
       FOR UPDATE`,
      [id]
    );

    if (!existing.length) {
      await connection.rollback();
      return false;
    }

    await connection.execute(
      `DELETE FROM tbtesttrandetail
       WHERE masterid = ?`,
      [id]
    );

    await connection.execute(
      `DELETE FROM tbtesttran
       WHERE testtranid = ?`,
      [id]
    );

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


export async function saveWidalOnly(
  patientId: number,
  input: TestTranInput
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [patientRows]: any = await connection.execute(
      `SELECT testtranid, widaltest
       FROM tbtesttran
       WHERE testtranid = ?
       FOR UPDATE`,
      [patientId]
    );

    if (!patientRows.length) {
      throw new Error("Patient record not found");
    }

    const widalEnabled = Number(patientRows[0].widaltest);

    await saveWidalData(
      connection,
      patientId,
      input,
      widalEnabled
    );

    await connection.commit();

    return await getWidalData(patientId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getWidalMethods() {
  const [rows]: any = await pool.execute(
    `SELECT methodid, methodname
     FROM tbwmethod
     ORDER BY methodid`
  );

  return rows;
}


export async function getWidalData(patientId: number) {
  // Check connected database
  const [databaseRows]: any = await pool.execute(
    `SELECT DATABASE() AS databaseName`
  );

  console.log("Connected Database:", databaseRows[0]?.databaseName);

  // Load Widal Method and Result
  const [methodRows]: any = await pool.execute(
    `SELECT
       patientid,
       methodid,
       resultid
     FROM tbwidaltestmethod
     WHERE patientid = ?`,
    [patientId]
  );

  console.log("Widal Method Result Rows:", methodRows);

  // Load Widal Test Dilution Data with Test Name
  const [testRows]: any = await pool.execute(
    `SELECT
       wt.Id AS id,
       wt.WTestId AS wtestid,
       wt.PatientId AS patientid,
       wtm.testname AS testname,
       wt.Dilution1 AS dilution1,
       wt.Dilution2 AS dilution2,
       wt.Dilution3 AS dilution3,
       wt.Dilution4 AS dilution4,
       wt.Dilution5 AS dilution5,
       wt.Dilution6 AS dilution6,
       wt.Dilution7 AS dilution7,
       wt.Dilution8 AS dilution8,
       wt.Dilution9 AS dilution9,
       wt.Dilution10 AS dilution10
     FROM tbwtest wt
     LEFT JOIN tbwidaltest wtm
       ON wtm.widaltestid = wt.WTestId
     WHERE wt.PatientId = ?
     ORDER BY wt.WTestId`,
    [patientId]
  );

  return {
    methodResult: methodRows.length > 0 ? methodRows[0] : null,
    tests: testRows,
  };
}

async function saveWidalData(
  connection: any,
  patientId: number,
  input: TestTranInput,
  widalEnabled: number
) {
  // Widal disabled: delete existing Widal records.
  if (widalEnabled !== 1) {
    await connection.execute(
      `DELETE FROM tbwtest WHERE PatientId = ?`,
      [patientId]
    );

    await connection.execute(
      `DELETE FROM tbwidaltestmethod WHERE patientid = ?`,
      [patientId]
    );

    return;
  }

  const methodId = toNumberOrNull(
    input.widalMethodId ?? input.widalmethodid
  );

  const resultId = toNumberOrNull(
    input.widalResultId ?? input.widalresultid
  );

  // Save method/result only if both selected.
  if (
    methodId !== null &&
    resultId !== null &&
    [1, 2].includes(methodId) &&
    [1, 2].includes(resultId)
  ) {
    await connection.execute(
      `DELETE FROM tbwidaltestmethod
       WHERE patientid = ?`,
      [patientId]
    );

    await connection.execute(
      `INSERT INTO tbwidaltestmethod
       (patientid, methodid, resultid)
       VALUES (?, ?, ?)`,
      [patientId, methodId, resultId]
    );
  }

  const widalTests =
    input.widalTests ??
    input.widaltests ??
    input.widalValues;

  // If dilution data was not submitted, preserve existing values.
  if (!Array.isArray(widalTests)) {
    return;
  }

  await connection.execute(
    `DELETE FROM tbwtest
     WHERE PatientId = ?`,
    [patientId]
  );

  const validWidalIds = [1, 2, 3, 4];

  for (const widalId of validWidalIds) {
    const item = widalTests.find(
      (x) => Number(x.wtestid ?? x.WTestId) === widalId
    );

    const dilution1 = item?.dilution1 ?? "";
    const dilution2 = item?.dilution2 ?? "";
    const dilution3 = item?.dilution3 ?? "";
    const dilution4 = item?.dilution4 ?? "";
    const dilution5 = item?.dilution5 ?? "";
    const dilution6 = item?.dilution6 ?? "";

    await connection.execute(
      `INSERT INTO tbwtest (
        WTestId,
        PatientId,
        Dilution1,
        Dilution2,
        Dilution3,
        Dilution4,
        Dilution5,
        Dilution6,
        Dilution7,
        Dilution8,
        Dilution9,
        Dilution10
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '')`,
      [
        widalId,
        patientId,
        dilution1,
        dilution2,
        dilution3,
        dilution4,
        dilution5,
        dilution6,
      ]
    );
  }
}