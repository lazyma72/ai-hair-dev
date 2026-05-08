import { message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { callApi } from "../../api/callApi"
import { type Column } from "../../components/DataTable"
import DataTable from "../../components/DataTable"
import PageShell from "../../components/PageShell"
import Row from "../../components/Row"
import Section from "../../components/Section"
import StatusView from "../../components/StatusView"
import { useApi } from "../../hooks/useApi"
import type { Db制帽 } from "../../shared/db/Db制帽"
import type { KLS胶丝比例 } from "../../shared/db/Db胶丝比例"
import type {
  制帽线色关联FrontendItem,
  胶丝比例Frontend,
} from "../../shared/frontend/model/model"

const 配比列: Column<KLS胶丝比例>[] = [
  {
    key: "发丝",
    title: "发丝",
    render: (r) => <span className="font-medium">{r.发丝}</span>,
  },
  {
    key: "色号",
    title: "色号",
    render: (r) => r.色号,
  },
  {
    key: "比例",
    title: "比例 %",
    render: (r) => (
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 rounded bg-slate-900"
          style={{ width: `${Math.min(r.比例, 100)}%`, minWidth: 4 }}
        />
        <span>{r.比例}%</span>
      </div>
    ),
  },
]

type HatMakingOption = Db制帽

type EditableOverride = {
  id: string
  制帽id: string
  线色: string
  备注: string
}

function inputCls() {
  return "w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
}

function textareaCls() {
  return "w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
}

function createEditableOverride(item?: 制帽线色关联FrontendItem): EditableOverride {
  return {
    id: `${item?.制帽id ?? "new"}-${Math.random().toString(36).slice(2, 8)}`,
    制帽id: item?.制帽id ?? "",
    线色: item?.线色 ?? "",
    备注: item?.备注 ?? "",
  }
}

export default function RatioDetailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const 颜色编号 = searchParams.get("colorNo") ?? ""
  const 发丝种类 = searchParams.get("hairType") ?? ""
  const [编辑中, set编辑中] = useState(false)
  const [保存中, set保存中] = useState(false)
  const [默认线色, set默认线色] = useState("")
  const [备注, set备注] = useState("")
  const [制帽线色列表, set制帽线色列表] = useState<EditableOverride[]>([])

  const { data, loading, error, reload } = useApi<{ 胶丝比例: 胶丝比例Frontend }>(() =>
    callApi("admin/ratio/GetDetail", {
      颜色编号,
      发丝种类,
    } as never),
  )

  const { data: hatData } = useApi<{
    list: HatMakingOption[]
    total: number
    pageNum: number
    pageSize: number
  }>(() =>
    callApi("admin/hatMaking/GetList", {
      pageNum: 1,
      pageSize: 1000,
      orderSort: "asc",
    } as never),
  )

  const ratio: 胶丝比例Frontend | null = data?.胶丝比例 ?? null
  const hatOptions = useMemo(() => hatData?.list ?? [], [hatData])
  const hatNameMap = useMemo(
    () => new Map(hatOptions.map(item => [item._id, item.名称])),
    [hatOptions],
  )

  useEffect(() => {
    if (!ratio) return
    set默认线色(ratio.线色 ?? "")
    set备注(ratio.备注 ?? "")
    set制帽线色列表(ratio.制帽线色列表.map(item => createEditableOverride(item)))
    set编辑中(false)
  }, [ratio])

  async function handleSave() {
    if (!ratio) return

    const duplicateHatIds = new Set<string>()
    const seenHatIds = new Set<string>()
    for (const item of 制帽线色列表) {
      const hatId = item.制帽id.trim()
      const threadColor = item.线色.trim()
      if (!hatId) {
        message.error("请选择制帽")
        return
      }
      if (!threadColor) {
        message.error("覆盖线色不能为空")
        return
      }
      if (seenHatIds.has(hatId)) {
        duplicateHatIds.add(hatId)
      }
      seenHatIds.add(hatId)
    }
    if (duplicateHatIds.size > 0) {
      message.error(`制帽重复：${Array.from(duplicateHatIds).join("、")}`)
      return
    }

    set保存中(true)
    try {
      const result = await callApi("admin/ratio/Update", {
        颜色编号: ratio._id.颜色编号,
        发丝种类: ratio._id.发丝种类,
        默认线色: 默认线色.trim() || undefined,
        备注: 备注.trim() || undefined,
        制帽线色列表: 制帽线色列表.map(item => ({
          制帽id: item.制帽id.trim(),
          线色: item.线色.trim(),
          备注: item.备注.trim() || undefined,
        })),
      } as never)
      if (!result.isSucc) {
        message.error(result.err.message)
        return
      }
      message.success("保存成功")
      set编辑中(false)
      reload()
    } finally {
      set保存中(false)
    }
  }

  function resetForm() {
    if (!ratio) return
    set默认线色(ratio.线色 ?? "")
    set备注(ratio.备注 ?? "")
    set制帽线色列表(ratio.制帽线色列表.map(item => createEditableOverride(item)))
    set编辑中(false)
  }

  return (
    <PageShell
      title={ratio ? `颜色：${ratio._id.颜色编号}` : "胶丝比例详情"}
      onBack={() => navigate(-1)}
      actions={
        ratio ? (
          编辑中 ? (
            <>
              <button
                type="button"
                className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
                onClick={resetForm}
                disabled={保存中}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleSave()}
                disabled={保存中}
              >
                {保存中 ? "保存中..." : "保存"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => set编辑中(true)}
            >
              编辑线色配置
            </button>
          )
        ) : null
      }
    >
      <StatusView loading={loading} error={error}>
        {ratio && (
          <div className="space-y-5">
            <Section title="基本信息">
              {编辑中 ? (
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-700">颜色编号</div>
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {ratio._id.颜色编号}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-700">发丝种类</div>
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {ratio._id.发丝种类}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      默认线色
                    </label>
                    <input
                      type="text"
                      className={inputCls()}
                      placeholder="例如：4#"
                      value={默认线色}
                      onChange={e => set默认线色(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      备注
                    </label>
                    <textarea
                      rows={3}
                      className={textareaCls()}
                      value={备注}
                      onChange={e => set备注(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <Row label="颜色编号" value={ratio._id.颜色编号} />
                  <Row label="发丝种类" value={ratio._id.发丝种类} />
                  <Row label="默认线色" value={ratio.线色 ?? "—"} />
                  <Row label="备注" value={ratio.备注 ?? "—"} />
                </div>
              )}
            </Section>

            {ratio.颜色图片参考 && (
              <Section title="颜色图片参考">
                <div className="p-4">
                  <img
                    src={`data:image/jpeg;base64,${ratio.颜色图片参考}`}
                    alt="颜色参考"
                    className="max-h-48 rounded object-contain"
                  />
                </div>
              </Section>
            )}

            <Section title="制帽对应线色列表">
              <div className="space-y-4 p-4">
                <div className="text-xs text-slate-500">
                  未配置制帽对应线色时，默认使用“默认线色”。
                </div>
                {编辑中 ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                          <tr>
                            <th className="px-3 py-2">制帽</th>
                            <th className="px-3 py-2">对应线色</th>
                            <th className="px-3 py-2">备注</th>
                            <th className="px-3 py-2 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {制帽线色列表.length > 0 ? (
                            制帽线色列表.map(item => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 align-top">
                                  <select
                                    className={inputCls()}
                                    value={item.制帽id}
                                    onChange={e =>
                                      set制帽线色列表(prev =>
                                        prev.map(row =>
                                          row.id === item.id
                                            ? { ...row, 制帽id: e.target.value }
                                            : row,
                                        ),
                                      )
                                    }
                                  >
                                    <option value="">请选择制帽</option>
                                    {hatOptions.map(option => (
                                      <option key={option._id} value={option._id}>
                                        {option._id} {option.名称 ? `- ${option.名称}` : ""}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <input
                                    type="text"
                                    className={inputCls()}
                                    placeholder="例如：4#"
                                    value={item.线色}
                                    onChange={e =>
                                      set制帽线色列表(prev =>
                                        prev.map(row =>
                                          row.id === item.id
                                            ? { ...row, 线色: e.target.value }
                                            : row,
                                        ),
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <input
                                    type="text"
                                    className={inputCls()}
                                    placeholder="可选"
                                    value={item.备注}
                                    onChange={e =>
                                      set制帽线色列表(prev =>
                                        prev.map(row =>
                                          row.id === item.id
                                            ? { ...row, 备注: e.target.value }
                                            : row,
                                        ),
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2 text-right align-top">
                                  <button
                                    type="button"
                                    className="rounded bg-slate-100 px-3 py-2 text-xs text-slate-700 hover:bg-slate-200"
                                    onClick={() =>
                                      set制帽线色列表(prev =>
                                        prev.filter(row => row.id !== item.id),
                                      )
                                    }
                                  >
                                    删除
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-3 py-6 text-center text-sm text-slate-400"
                              >
                                暂无制帽对应线色配置
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                      onClick={() =>
                        set制帽线色列表(prev => [...prev, createEditableOverride()])
                      }
                    >
                      + 新增制帽对应线色
                    </button>
                  </div>
                ) : ratio.制帽线色列表.length > 0 ? (
                  <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                        <tr>
                          <th className="px-3 py-2">制帽编号</th>
                          <th className="px-3 py-2">制帽名称</th>
                          <th className="px-3 py-2">对应线色</th>
                          <th className="px-3 py-2">备注</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {ratio.制帽线色列表.map(item => (
                          <tr key={item.制帽id}>
                            <td className="px-3 py-2 font-mono text-slate-900">
                              {item.制帽id}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {item.制帽名称 ?? hatNameMap.get(item.制帽id) ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-900">{item.线色}</td>
                            <td className="px-3 py-2 text-slate-700">{item.备注 ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">
                    当前没有制帽对应线色，全部制帽默认使用该颜色的默认线色。
                  </div>
                )}
              </div>
            </Section>

            <Section title="D 色配比">
              <DataTable
                columns={配比列}
                rows={ratio.D}
                rowKey={r => `${r.发丝}-${r.色号}`}
              />
            </Section>

            {ratio.M && ratio.M.length > 0 && (
              <Section title="M 色配比">
                <DataTable
                  columns={配比列}
                  rows={ratio.M}
                  rowKey={r => `${r.发丝}-${r.色号}`}
                />
              </Section>
            )}

            {ratio.L && ratio.L.length > 0 && (
              <Section title="L 色配比">
                <DataTable
                  columns={配比列}
                  rows={ratio.L}
                  rowKey={r => `${r.发丝}-${r.色号}`}
                />
              </Section>
            )}
          </div>
        )}
      </StatusView>
    </PageShell>
  )
}
