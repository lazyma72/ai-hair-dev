import PageShell from "../../components/PageShell"
import * as React from "react"
import HandWovenEditor from "../../modules/handWovenDev/HandWovenEditor"
import { createEmpty手织图 } from "../../modules/handWovenDev/svgBuilder"

export default function HandWovenAnnotatorPage() {
  const [data, setData] = React.useState(() => createEmpty手织图())

  return (
    <PageShell
      title="手织标注测试页面"
      onBack={() => window.history.back()}
      fullWidth
      compact
      actions={<div className="text-xs text-slate-500">入口：/test/hand-woven-annotator</div>}
    >
      <HandWovenEditor
        value={data}
        onChange={setData}
        title="手织标注测试页面"
        description="生成横排 / 方形 / 特殊手织图 SVG，并支持继续编辑。"
        showJsonActions
        fullscreen
      />
    </PageShell>
  )
}
