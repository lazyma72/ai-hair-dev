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
        description="分开维护间色比例参数与手织图 SVG，SVG 使用编辑器直接修改。"
        showJsonActions
        fullscreen
      />
    </PageShell>
  )
}
