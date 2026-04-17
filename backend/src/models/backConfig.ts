import dotenv from "dotenv"
dotenv.config()
import { z } from "zod"

// 环境变量 Schema
const EnvSchema = z.object({
  MONGO_URI: z.string().min(1),
  ENV: z.string().min(1),
  JWT_SECRET: z.string().min(16),
})

/**
 * 优雅地解析并验证配置
 */
function parseEnvConfig() {
  const result = EnvSchema.safeParse(process.env)

  if (!result.success) {
    console.error("\n❌ 环境变量配置错误:\n")
    result.error.issues.forEach(err => {
      const field = err.path.join(".")
      console.error(`  - ${field}: ${err.message}`)
    })
    console.error("\n请检查 .env 文件或环境变量配置\n")
    process.exit(1)
  }

  return result.data
}

// 验证环境变量
const env = parseEnvConfig()

export const backConfig = {
  /** mongo connection url */
  mongoUrl: env.MONGO_URI,
  env: env.ENV,
  /** JWT 签名密钥 */
  jwtSecret: env.JWT_SECRET,
}
