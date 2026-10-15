import { pool } from "../config/database";

export async function findUserByUsernameOrEmail(identifier: string) {
  const [rows]: any = await pool.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [identifier, identifier],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findUserByEmail(email: string) {
  return findUserByUsernameOrEmail(email);
}

export async function findUserById(id: number) {
  const [rows]: any = await pool.query(
    "SELECT id, name, username, email, phone, userRoleCode FROM users WHERE id = ?",
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findUserWithPasswordById(id: number) {
  const [rows]: any = await pool.query(
    "SELECT id, password FROM users WHERE id = ?",
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function updateUserPassword(
  id: number,
  passwordHash: string,
  plainPassword: string,
) {
  const [result]: any = await pool.query(
    "UPDATE users SET password = ?, plain_password = ? WHERE id = ?",
    [passwordHash, plainPassword, id],
  );
  return result.affectedRows > 0;
}
