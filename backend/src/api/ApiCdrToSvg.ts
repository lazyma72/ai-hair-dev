import fs from "fs"
import path from "path"
import { promisify } from "util"
import { execFile } from "child_process"
import { ApiCall } from "tsrpc"
import { v4 as uuidv4 } from "uuid"
import { ReqCdrToSvg, ResCdrToSvg } from "../shared/protocols/PtlCdrToSvg"

const execFileAsync = promisify(execFile)

/** 静态文件根目录，与 Docker -v /root/file-server:/app/static 对应 */
const STATIC_ROOT = path.resolve(__dirname, "../static")
const TEMP_ROOT = path.join(STATIC_ROOT, "tmp", "cdr-to-svg")
const ALLOWED_INPUT_EXTS = new Set([".cdr"])

async function safeRemove(filePath: string) {
  try {
    await fs.promises.rm(filePath, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}

export default async function (call: ApiCall<ReqCdrToSvg, ResCdrToSvg>) {
  const { fileData, fileName, dirName } = call.req

  if (!/^[a-zA-Z0-9_-]+$/.test(dirName)) {
    return call.error("dirName 只允许字母、数字、下划线和连字符", { code: "INVALID_DIR" })
  }

  const ext = path.extname(fileName).toLowerCase()
  if (!ext || !ALLOWED_INPUT_EXTS.has(ext)) {
    return call.error(`仅支持 CDR 文件转换：${ext || "(无后缀)"}`, { code: "INVALID_EXT" })
  }

  const jobId = uuidv4()
  const workDir = path.join(TEMP_ROOT, dirName, jobId)
  const inputPath = path.join(workDir, `input${ext}`)
  const outputPath = path.join(workDir, "output.svg")

  try {
    await fs.promises.mkdir(workDir, { recursive: true })
    await fs.promises.writeFile(inputPath, fileData)

    try {
      await execFileAsync("uniconvertor", [inputPath, outputPath], {
        timeout: 60_000,
        maxBuffer: 10 * 1024 * 1024,
      })
    } catch (error) {
      const stderr =
        typeof error === "object" && error && "stderr" in error
          ? String((error as { stderr?: unknown }).stderr ?? "").trim()
          : ""
      const stdout =
        typeof error === "object" && error && "stdout" in error
          ? String((error as { stdout?: unknown }).stdout ?? "").trim()
          : ""
      const detail = stderr || stdout

      if (detail.includes("ENOENT") || detail.includes("not found")) {
        return call.error("服务器未安装 uniconvertor，无法转换 CDR", {
          code: "UNICONVERTOR_NOT_FOUND",
        })
      }

      return call.error(detail ? `CDR 转 SVG 失败：${detail}` : "CDR 转 SVG 失败", {
        code: "CDR_TO_SVG_FAILED",
      })
    }

    const svg = await fs.promises.readFile(outputPath, "utf-8")
    if (!svg.trim()) {
      return call.error("CDR 转 SVG 失败：输出为空", { code: "EMPTY_SVG_OUTPUT" })
    }

    call.succ({ svg })
  } finally {
    await safeRemove(workDir)
  }
}
