import * as React from "react"
import { message } from "antd"
import {
  Field,
  OneDecimalInput,
  Section,
  TextInput,
  inputCls,
} from "../../pages/admin/add-file/components/ui"
import type {
  手织图,
  手织图比例键,
  手织图类型,
} from "../../shared/models/手织图"
import {
  build手织图Svg,
  createEmpty手织图,
  createEmpty手织图SourceSvg,
  get当前分组节点ID,
  get有效排序,
} from "./svgBuilder"
import OpenSourceSvgEditor from "./OpenSourceSvgEditor"

const 比例键列表: 手织图比例键[] = ["D", "M", "L"]
const 比例组合列表 = ["D:M", "D:L", "D:M:L"] as const

type 可生成类型 = Extract<手织图["类型"], { type: "横排" | "方形" }>
type 比例组合 = (typeof 比例组合列表)[number]

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

function clone生成类型(type: 可生成类型): 可生成类型 {
  return {
    ...type,
    比值: {
      D: { ...type.比值.D },
      M: type.比值.M ? { ...type.比值.M } : undefined,
      L: type.比值.L ? { ...type.比值.L } : undefined,
    },
  }
}

function ensure生成类型(data: 手织图): 可生成类型 {
  if (data.类型.type !== "特殊") {
    return clone生成类型(data.类型)
  }
  return {
    type: "横排",
    groupNodeId: "hand_woven_horizontal_group",
    比值: {
      D: { 值: 1, remark: "", sort: 1 },
      M: { 值: 2, remark: "", sort: 2 },
      L: { 值: 1, remark: "", sort: 3 },
    },
  }
}

function create默认比例项(sort: number) {
  return {
    值: 1,
    remark: "",
    是否染色: false,
    sort,
  }
}

function get比例组合(type: 可生成类型): 比例组合 {
  const hasM = Boolean(type.比值.M)
  const hasL = Boolean(type.比值.L)
  if (hasM && hasL) return "D:M:L"
  if (hasL) return "D:L"
  return "D:M"
}

function get组合键列表(combo: 比例组合): 手织图比例键[] {
  if (combo === "D:L") return ["D", "L"]
  if (combo === "D:M:L") return ["D", "M", "L"]
  return ["D", "M"]
}

function apply比例组合(type: 可生成类型, combo: 比例组合): 可生成类型 {
  const keys = get组合键列表(combo)
  const next比值: 可生成类型["比值"] = {
    D: {
      ...(type.比值.D ?? create默认比例项(1)),
      sort: 1,
    },
  }

  if (keys.includes("M")) {
    next比值.M = {
      ...(type.比值.M ?? create默认比例项(keys.indexOf("M") + 1)),
      sort: keys.indexOf("M") + 1,
    }
  }

  if (keys.includes("L")) {
    next比值.L = {
      ...(type.比值.L ?? create默认比例项(keys.indexOf("L") + 1)),
      sort: keys.indexOf("L") + 1,
    }
  }

  return {
    ...type,
    比值: next比值,
  }
}

function move排序(
  type: 可生成类型,
  key: 手织图比例键,
  direction: "up" | "down"
): 可生成类型 {
  const entries = 比例键列表
    .map((itemKey, index) => ({
      key: itemKey,
      item: type.比值[itemKey],
      index,
    }))
    .filter(({ item }) => Boolean(item && item.值 > 0))
    .sort((left, right) => {
      const leftSort = Number(left.item?.sort ?? left.index + 1)
      const rightSort = Number(right.item?.sort ?? right.index + 1)
      if (leftSort !== rightSort) return leftSort - rightSort
      return left.index - right.index
    })

  const currentIndex = entries.findIndex((entry) => entry.key === key)
  if (currentIndex < 0) return type
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= entries.length) return type

  ;[entries[currentIndex], entries[targetIndex]] = [
    entries[targetIndex],
    entries[currentIndex],
  ]

  const next比值 = { ...type.比值 }
  entries.forEach((entry, index) => {
    const item = next比值[entry.key]
    if (!item) return
    next比值[entry.key] = {
      ...item,
      sort: index + 1,
    }
  })

  return {
    ...type,
    比值: next比值,
  }
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function deriveSelectedType(value: 手织图): 手织图类型 | "" {
  if (value.svg.trim()) return value.类型.type
  return value.类型.type === "特殊" ? "" : value.类型.type
}

function deriveSourceSvg(value: 手织图): string {
  if (value.类型.type === "特殊") return value.svg
  return value.svg.trim() || createEmpty手织图SourceSvg()
}

export default function HandWovenEditor({
  title = "手织图编辑",
  description = "请选择手织图类型并上传 SVG，在当前页面完成生成和编辑。",
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
  const [selectedType, setSelectedType] = React.useState<手织图类型 | "">(
    () => deriveSelectedType(value),
  )
  const [sourceSvg, setSourceSvg] = React.useState(() => deriveSourceSvg(value))
  const [hasLoadedSvg, setHasLoadedSvg] = React.useState(() => Boolean(value.svg.trim()))
  const [data, setData] = React.useState<手织图>(() =>
    value.svg || value.类型.type !== "特殊" ? value : createEmpty手织图(),
  )

  React.useEffect(() => {
    setData(value.svg || value.类型.type !== "特殊" ? value : createEmpty手织图())
    setSelectedType(deriveSelectedType(value))
    setSourceSvg(deriveSourceSvg(value))
    setHasLoadedSvg(Boolean(value.svg.trim()))
  }, [value])

  const 当前生成类型 =
    selectedType && data.类型.type !== "特殊" ? data.类型 : null
  const 有效排序 = get有效排序(data)
  const 当前比例组合 = 当前生成类型 ? get比例组合(当前生成类型) : "D:M:L"
  const 当前组合键列表 = 当前生成类型 ? get组合键列表(当前比例组合) : []

  function commit(nextData: 手织图) {
    setData(nextData)
    onChange(nextData)
  }

  function get当前源图Svg(nextData: 手织图): string {
    return sourceSvg.trim() || nextData.svg.trim() || createEmpty手织图SourceSvg()
  }

  function syncSourceSvg(nextSourceSvg: string, options?: { silent?: boolean }) {
    setSourceSvg(nextSourceSvg)
    setHasLoadedSvg(Boolean(nextSourceSvg.trim()))

    const nextData =
      data.类型.type === "特殊"
        ? {
            ...data,
            svg: nextSourceSvg,
          }
        : build手织图Svg(data, { sourceSvg: nextSourceSvg })

    commit(nextData)
    if (!options?.silent) {
      message.success(data.类型.type === "特殊" ? "已替换 SVG" : "已应用源图 SVG")
    }
  }

  function syncEditorSvg(nextSvg: string, options?: { silent?: boolean }) {
    const nextData = {
      ...data,
      svg: nextSvg,
    }
    commit(nextData)

    if (selectedType === "特殊") {
      setSourceSvg(nextSvg)
    }

    if (!options?.silent) {
      message.success("已更新当前 SVG")
    }
  }

  function update生成类型(mutator: (draft: 可生成类型) => 可生成类型) {
    const nextType = mutator(ensure生成类型(data))
    const nextData = build手织图Svg(
      {
        ...data,
        类型: nextType,
      },
      {
        sourceSvg: data.svg.trim() || get当前源图Svg(data),
      },
    )
    commit(nextData)
  }

  function change类型(nextType: 手织图类型) {
    const cleanSourceSvg = ""
    setSelectedType(nextType)
    setSourceSvg(cleanSourceSvg)
    setHasLoadedSvg(false)
    onFileNameChange?.(null)

    if (nextType === "特殊") {
      commit({
        ...data,
        svg: cleanSourceSvg,
        类型: { type: "特殊" },
      })
      return
    }

    const base = ensure生成类型(data)
    commit(
      build手织图Svg(
        {
          ...data,
          svg: cleanSourceSvg,
          类型: {
            ...base,
            type: nextType,
            groupNodeId:
              nextType === "横排"
                ? "hand_woven_horizontal_group"
                : "hand_woven_square_group",
          },
        },
        {
          sourceSvg: createEmpty手织图SourceSvg(),
        },
      ),
    )
  }

  function handleSourceUpload(file: File) {
    if (!selectedType) {
      message.error("请先选择手织图类型")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : ""
      onFileNameChange?.(file.name)
      syncSourceSvg(text, { silent: true })
      message.success(`已导入源图 ${file.name}`)
    }
    reader.readAsText(file, "utf-8")
  }

  function handleSpecialUpload(file: File) {
    if (!selectedType) {
      message.error("请先选择手织图类型")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : ""
      onFileNameChange?.(file.name)
      setSourceSvg(text)
      setHasLoadedSvg(Boolean(text.trim()))
      commit({
        ...data,
        svg: text,
        类型: { type: "特殊" },
      })
      message.success(`已导入 ${file.name}`)
    }
    reader.readAsText(file, "utf-8")
  }

  const content = (
    <section
      className={
        embed
          ? "rounded-xl border border-slate-200 bg-white"
          : fullscreen
            ? "rounded-xl border border-slate-100 bg-slate-50 p-5"
            : "rounded-xl border border-slate-100 bg-slate-50 p-5"
      }
    >
      {!embed ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </p>
            <div className="mt-1 text-xs text-slate-500">{description}</div>
          </div>
          {showJsonActions ? (
            <details className="shrink-0">
              <summary className="cursor-pointer list-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                JSON 操作
              </summary>
              <div className="mt-2 flex min-w-[140px] flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                      message.success("已复制 JSON")
                    } catch {
                      message.error("复制失败")
                    }
                  }}
                >
                  复制 JSON
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={() => {
                    downloadTextFile(
                      "hand-woven.json",
                      JSON.stringify(data, null, 2),
                      "application/json;charset=utf-8",
                    )
                  }}
                >
                  下载 JSON
                </button>
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className={embed ? "space-y-2 border-b border-slate-100 p-4 xl:border-b-0 xl:border-r" : "space-y-2"}>
          <Section title="生成参数">
            <div className="space-y-2">
              <Field label="手织图类型">
                <select
                  className={inputCls}
                  value={selectedType}
                  onChange={(e) => {
                    const nextType = e.target.value as 手织图类型 | ""
                    if (!nextType) {
                      setSelectedType("")
                      setSourceSvg("")
                      setHasLoadedSvg(false)
                      onFileNameChange?.(null)
                      commit({ svg: "", 类型: { type: "特殊" } })
                      return
                    }
                    change类型(nextType)
                  }}
                >
                  <option value="">请选择类型</option>
                  <option value="横排">横排</option>
                  <option value="方形">方形</option>
                  <option value="特殊">特殊</option>
                </select>
              </Field>

              {!selectedType ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600">
                  请先选择手织图类型，再上传或编辑 SVG。
                </div>
              ) : 当前生成类型 ? (
                <>
                  <Field label="比例组合">
                    <select
                      className={inputCls}
                      value={当前比例组合}
                      onChange={(e) =>
                        update生成类型((draft) =>
                          apply比例组合(draft, e.target.value as 比例组合),
                        )
                      }
                    >
                      {比例组合列表.map((combo) => (
                        <option key={combo} value={combo}>
                          {combo}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid gap-1.5">
                    {当前组合键列表.map((key) => {
                      const item =
                        当前生成类型.比值[key] ??
                        {
                          值: 0,
                          remark: "",
                          是否染色: false,
                          sort: 比例键列表.indexOf(key) + 1,
                        }
                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-slate-900">
                              {key}
                            </div>
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <input
                                type="checkbox"
                                checked={Boolean(item.是否染色)}
                                onChange={(e) =>
                                  update生成类型((draft) => ({
                                    ...draft,
                                    比值: {
                                      ...draft.比值,
                                      [key]: {
                                        ...(draft.比值[key] ?? {
                                          值: 0,
                                          sort: 比例键列表.indexOf(key) + 1,
                                        }),
                                        是否染色: e.target.checked,
                                      },
                                    },
                                  }))
                                }
                              />
                              染色后显示 {key}T
                            </label>
                          </div>

                          <div className="grid gap-1.5">
                            <Field label="比值">
                              <OneDecimalInput
                                value={item.值}
                                onChange={(nextValue) =>
                                  update生成类型((draft) => ({
                                    ...draft,
                                    比值: {
                                      ...draft.比值,
                                      [key]: {
                                        ...(draft.比值[key] ?? {
                                          值: 0,
                                          sort: 比例键列表.indexOf(key) + 1,
                                        }),
                                        值: nextValue,
                                      },
                                    },
                                  }))
                                }
                              />
                            </Field>
                            <Field label="备注">
                              <TextInput
                                value={item.remark ?? ""}
                                onChange={(remark) =>
                                  update生成类型((draft) => ({
                                    ...draft,
                                    比值: {
                                      ...draft.比值,
                                      [key]: {
                                        ...(draft.比值[key] ?? {
                                          值: 0,
                                          sort: 比例键列表.indexOf(key) + 1,
                                        }),
                                        remark,
                                      },
                                    },
                                  }))
                                }
                                placeholder="可留空"
                              />
                            </Field>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-700">
                      排序（值大于 0 的项会参与生成）
                    </div>
                    <div className="space-y-1">
                      {有效排序.map((key, index) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded border border-slate-200 px-2 py-1"
                        >
                          <div className="text-xs text-slate-700">
                            {index + 1}. {key}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
                              onClick={() =>
                                update生成类型((draft) => move排序(draft, key, "up"))
                              }
                            >
                              上移
                            </button>
                            <button
                              type="button"
                              className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
                              onClick={() =>
                                update生成类型((draft) => move排序(draft, key, "down"))
                              }
                            >
                              下移
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5">
                  <div className="text-xs text-slate-700">
                    特殊模式不自动生成，请在右侧编辑区直接上传或替换完整 SVG。
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className={embed ? "space-y-3 p-4" : "space-y-3"}>
          <Section
            title="SVG 编辑"
            action={
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {selectedType ? "上传 SVG 后可继续编辑" : "请先选择类型"}
                </span>
              </div>
            }
          >
            {selectedType ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {showUploader ? (
                    selectedType === "特殊" ? (
                      <label className="inline-flex cursor-pointer items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        上传新 SVG
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleSpecialUpload(file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        上传源图 SVG
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleSourceUpload(file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    )
                  ) : null}
                  <button
                    type="button"
                    className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    onClick={() =>
                      downloadTextFile("hand-woven.svg", data.svg, "image/svg+xml")
                    }
                  >
                    下载当前 SVG
                  </button>
                  <div className="text-xs text-slate-500">
                    {fileName
                      ? `当前 SVG：${fileName}`
                      : hasLoadedSvg
                        ? "当前 SVG：已导入"
                        : emptyText}
                  </div>
                </div>

                {hasLoadedSvg ? (
                  <div
                    className={
                      embed
                        ? `overflow-hidden ${heightClassName ?? "h-[60vh] min-h-[520px]"}`
                        : "h-[70vh] min-h-[560px] overflow-hidden"
                    }
                  >
                    <OpenSourceSvgEditor
                      title={selectedType === "特殊" ? "SVG 可视化编辑" : "当前 SVG 可视化编辑"}
                      svg={data.svg}
                      groupNodeId={selectedType === "特殊" ? undefined : get当前分组节点ID(data)}
                      onChange={(nextSvg) => syncEditorSvg(nextSvg, { silent: true })}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    请先上传 SVG 后再编辑。
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                请先在左侧选择手织图类型，再上传或编辑 SVG。
              </div>
            )}
          </Section>
        </div>
      </div>
    </section>
  )

  if (embed) return content

  return fullscreen ? (
    content
  ) : (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        {description}
      </div>
      {content}
    </>
  )
}
