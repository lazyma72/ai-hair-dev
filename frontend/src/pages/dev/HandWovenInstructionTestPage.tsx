import PageShell from "../../components/PageShell"
import * as React from "react"
import HandWovenInstructionTestEditor, {
  createEmpty手织指示单测试值,
} from "../../modules/handWovenDev/HandWovenInstructionTestEditor"

export default function HandWovenInstructionTestPage() {
  const [data, setData] = React.useState(() => createEmpty手织指示单测试值())

  return (
    <PageShell
      title="手织指示单测试页面"
      onBack={() => window.history.back()}
      fullWidth
      compact
      actions={<div className="text-xs text-slate-500">入口：/test/hand-woven-instruction</div>}
    >
      <HandWovenInstructionTestEditor
        value={data}
        onChange={setData}
        title="手织指示单测试页面"
        description="按 `手织指示单` 结构维护手织图类型生成列表，并预览横排和方形 SVG。"
      />
    </PageShell>
  )
}
