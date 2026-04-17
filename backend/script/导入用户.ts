import dotenv from "dotenv"
dotenv.config()
import { Global } from "../src/models/Global"
import { hashPassword } from "../src/models/password"
import { ObjectId } from "mongodb"
import crypto from "crypto"

/** 与前端保持一致：先 sha256，再由 hashPassword(bcrypt) 存储 */
function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex")
}

async function main() {
  await Global.init()

  const plainPassword = "admin"
  const now = new Date()

  await Global.getCollection("用户").insertOne({
    _id: new ObjectId(),
    username: "admin",
    name: "管理员",
    password: await hashPassword(sha256(plainPassword)),
    role: "admin",
    createTime: now,
    updateTime: now,
  })
  console.log("用户 admin 已创建，密码为 admin")
  process.exit(0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
