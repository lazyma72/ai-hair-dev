import HandWovenEditor from "../../../../modules/handWovenDev/HandWovenEditor"
import type { 手织图 } from "../../../../shared/models/手织图"

type Props = {
  title?: string
  description?: string
  value: 手织图
  onChange: (v: 手织图) => void
  fileName?: string | null
  onFileNameChange?: (name: string | null) => void
  emptyText?: string
  showJsonActions?: boolean
  fullscreen?: boolean
  embed?: boolean
  heightClassName?: string
  showUploader?: boolean
}

export default function HandWovenImportStep({
  title = "导入手织图",
  description = "请选择手织图类型并上传 SVG，在当前页面完成生成与编辑。",
  value,
  onChange,
  fileName,
  onFileNameChange,
  emptyText = "请先选择一份手织图 SVG 文件。",
  showJsonActions = true,
  fullscreen = false,
  embed = false,
  heightClassName,
  showUploader = true,
}: Props) {
  return (
    <HandWovenEditor
      title={title}
      description={description}
      value={value}
      onChange={onChange}
      fileName={fileName}
      onFileNameChange={onFileNameChange}
      emptyText={emptyText}
      showJsonActions={showJsonActions}
      fullscreen={fullscreen}
      embed={embed}
      heightClassName={heightClassName}
      showUploader={showUploader}
    />
  )
}
