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

type ExecFileError = {
  code?: unknown
  message?: unknown
  stderr?: unknown
  stdout?: unknown
}

async function safeRemove(filePath: string) {
  try {
    await fs.promises.rm(filePath, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}

function getExecErrorDetail(error: unknown) {
  if (typeof error !== "object" || !error) {
    return { code: "", detail: "" }
  }

  const execError = error as ExecFileError
  const code = String(execError.code ?? "").trim()
  const message = String(execError.message ?? "").trim()
  const stderr = String(execError.stderr ?? "").trim()
  const stdout = String(execError.stdout ?? "").trim()
  const detail = stderr || stdout || message

  return { code, detail }
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
      await execFileAsync(
        "inkscape",
        [inputPath, "--export-type=svg", `--export-filename=${outputPath}`],
        {
          timeout: 60_000,
          maxBuffer: 10 * 1024 * 1024,
        }
      )
    } catch (error) {
      const { code, detail } = getExecErrorDetail(error)

      if (
        code === "ENOENT" ||
        detail.includes("ENOENT") ||
        detail.includes("not found") ||
        detail.includes("spawn inkscape")
      ) {
        return call.error("服务器未安装 inkscape，无法转换 CDR", {
          code: "INKSCAPE_NOT_FOUND",
        })
      }

      return call.error(detail ? `CDR 转 SVG 失败：${detail}` : "CDR 转 SVG 失败", {
        code: "CDR_TO_SVG_FAILED",
      })
    }

    try {
      await fs.promises.access(outputPath, fs.constants.F_OK)
    } catch {
      return call.error("CDR 转 SVG 失败：未生成 output.svg", {
        code: "EMPTY_SVG_OUTPUT",
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
