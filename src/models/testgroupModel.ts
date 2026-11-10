
import { pool } from "../config/database";

export interface GroupInput {
  groupName?: string;
  description?: string;
  parentId?: number | string;
  orderNo?: number | string;
  disabledInNewTran?: boolean | number;
}

function clean(data: GroupInput) {
  return {
    groupName: String(data.groupName || "").trim(),
    description: String(data.description || "").trim(),
    parentId: Number(data.parentId || 0),
    orderNo: Number(data.orderNo || 0),
    disabledInNewTran: data.disabledInNewTran ? 1 : 0,
  };
}

const SELECT_FIELDS = `
  g.groupId AS groupId,
  g.groupName AS groupName,
  g.description AS description,
  g.parentId AS parentId,
  g.orderNo AS orderNo,
  g.disabledInNewTran AS disabledInNewTran,
  p.groupName AS parentGroupName
`;

export async function getAll() {
  const [rows]: any = await pool.execute(`
    SELECT ${SELECT_FIELDS}
    FROM tbgroupmaster g
    LEFT JOIN tbgroupmaster p ON p.groupId = g.parentId
    ORDER BY g.orderNo, g.groupName
  `);

  return rows;
}

export async function getById(id: number) {
  const [rows]: any = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM tbgroupmaster g
     LEFT JOIN tbgroupmaster p ON p.groupId = g.parentId
     WHERE g.groupId = ?`,
    [id]
  );

  return rows[0] || null;
}

export async function create(groupData: GroupInput) {
  const d = clean(groupData);

  if (!d.groupName) {
    throw new Error("Group name is required");
  }

  const [result]: any = await pool.execute(
    `INSERT INTO tbgroupmaster
      (groupName, description, parentId, orderNo, disabledInNewTran)
     VALUES (?, ?, ?, ?, ?)`,
    [
      d.groupName,
      d.description || null,
      d.parentId,
      d.orderNo,
      d.disabledInNewTran,
    ]
  );

  return getById(Number(result.insertId));
}

export async function update(id: number, groupData: GroupInput) {
  const d = clean(groupData);

  if (!d.groupName) {
    throw new Error("Group name is required");
  }

  if (d.parentId === id) {
    throw new Error("A group cannot be its own parent");
  }

  const [result]: any = await pool.execute(
    `UPDATE tbgroupmaster
     SET groupName = ?,
         description = ?,
         parentId = ?,
         orderNo = ?,
         disabledInNewTran = ?
     WHERE groupId = ?`,
    [
      d.groupName,
      d.description || null,
      d.parentId,
      d.orderNo,
      d.disabledInNewTran,
      id,
    ]
  );

  // MySQL may report zero affected rows if values did not change.
  const existing = await getById(id);

  if (!existing) {
    return null;
  }

  return existing;
}

export async function remove(id: number) {
  // First check whether any Test exists in this Group
  const [rows]: any = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM tbtestmaster
     WHERE groupid = ?`,
    [id]
  );

  const total = Number(rows[0]?.total ?? 0);

  if (total > 0) {
    throw new Error(
      "This Group cannot be deleted because Tests are already created under it."
    );
  }

  // Delete Group only when no Tests exist
  const [result]: any = await pool.execute(
    `DELETE FROM tbgroupmaster
     WHERE groupId = ?`,
    [id]
  );

  return result.affectedRows > 0;
}
export const updateTestGroupOrder = async (groups: any[]) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const group of groups) {
      await connection.query(
        `UPDATE tbgroupmaster
         SET orderno = ?
         WHERE groupId = ?`,
        [Number(group.orderNo), Number(group.groupId)]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};