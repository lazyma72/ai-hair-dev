import fs from "fs"
import path from "path"
import { ApiCall } from "tsrpc"
import { v4 as uuidv4 } from "uuid"
import { ReqUpload, ResUpload } from "../shared/protocols/PtlUpload"

/** 静态文件根目录，与 Docker -v /root/file-server:/app/static 对应 */
const STATIC_ROOT = path.resolve(__dirname, "../static")

/** 允许上传的文件后缀白名单（小写） */
const ALLOWED_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".json",
  ".cdr",
])

export default async function (call: ApiCall<ReqUpload, ResUpload>) {
  const { fileData, fileName, dirName } = call.req

  // 校验 dirName，只允许字母数字下划线连字符，防止路径穿越
  if (!/^[a-zA-Z0-9_-]+$/.test(dirName)) {
    return call.error("dirName 只允许字母、数字、下划线和连字符", { code: "INVALID_DIR" })
  }

  // 提取并校验后缀
  const ext = path.extname(fileName).toLowerCase()
  if (!ext || !ALLOWED_EXTS.has(ext)) {
    return call.error(`不支持的文件类型：${ext || "(无后缀)"}`, { code: "INVALID_EXT" })
  }

  // 构建存储目录
  const saveDir = path.join(STATIC_ROOT, "upload", dirName)
  fs.mkdirSync(saveDir, { recursive: true })

  // 生成唯一文件名
  const saveName = `${uuidv4()}${ext}`
  const savePath = path.join(saveDir, saveName)

  // 写入文件
  await fs.promises.writeFile(savePath, fileData)

  // 返回相对 URL 路径
  call.succ({ path: `/upload/${dirName}/${saveName}` })
}
