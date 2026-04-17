import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 10

/** 将前端传来的 sha256 hash 用 bcrypt 加盐后存储 */
export async function hashPassword(sha256Hex: string): Promise<string> {
  return bcrypt.hash(sha256Hex, BCRYPT_ROUNDS)
}

/** 校验：sha256Hex 为前端传来的 sha256 hash，storedHash 为 bcrypt 存储值 */
export async function verifyPassword(sha256Hex: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(sha256Hex, storedHash)
}
