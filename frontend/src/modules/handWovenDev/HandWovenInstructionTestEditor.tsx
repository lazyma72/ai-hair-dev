import * as React from "react"
import { message } from "antd"
import InlineSvg from "../../components/InlineSvg"
import {
  AddBtn,
  DelBtn,
  Field,
  NumInput,
  Section,
  TextInput,
} from "../../pages/admin/add-file/components/ui"

export type 手织图间色比例项 =
  | {
      type: "横排"
      DML规律: string
    }
  | {
      type: "方形"
      DML规律: string
      边长: number
    }

export interface 手织指示单测试值 {
  注意事项: string
  手织图svg: string
  /* 手织图比例，没有则代表特殊 */
  手织图比例?: 手织图间色比例项[]
}

type Props = {
  value: 手织指示单测试值
  onChange: (nextValue: 手织指示单测试值) => void
  title?: string
  description?: string
}

type SvgPreviewBlock = {
  width: number
  height: number
  body: string
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

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function get规律标签列表(value: string): string[] {
  const matches = value.toUpperCase().match(/[DML]T?/g)
  if (matches && matches.length > 0) return matches.slice(0, 12)

  const tokens = value
    .split(/[\s,/:=|+-]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  return tokens.slice(0, 12)
}

function create横排预览(item: Extract<手织图间色比例项, { type: "横排" }>): SvgPreviewBlock {
  const labels = get规律标签列表(item.DML规律)
  const chips = labels.length > 0 ? labels : ["D", "M", "L"]
  const chipWidth = 84
  const gap = 12
  const bodyWidth = chips.length * chipWidth + Math.max(0, chips.length - 1) * gap
  const width = Math.max(560, bodyWidth + 120)
  const startX = (width - bodyWidth) / 2

  const blocks = chips
    .map((label, index) => {
      const x = startX + index * (chipWidth + gap)
      return `
        <rect x="${x}" y="82" rx="14" ry="14" width="${chipWidth}" height="54" fill="#eff6ff" stroke="#60a5fa" stroke-width="2" />
        <text x="${x + chipWidth / 2}" y="109" fill="#1e3a8a" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" font-weight="700">${escapeXml(label)}</text>
      `
    })
    .join("")

  return {
    width,
    height: 182,
    body: `
      <rect x="1" y="1" width="${width - 2}" height="180" rx="18" ry="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      <text x="${width / 2}" y="30" fill="#0f172a" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="700">横排间色比例</text>
      <text x="${width / 2}" y="56" fill="#64748b" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="13">规律：${escapeXml(item.DML规律 || "未填写")}</text>
      ${blocks}
    `,
  }
}

function create方形预览(item: Extract<手织图间色比例项, { type: "方形" }>): SvgPreviewBlock {
  const labels = get规律标签列表(item.DML规律)
  const chips = labels.length > 0 ? labels : ["D", "M", "L", "D"]
  const size = 220
  const startX = 60
  const startY = 56
  const cellSize = size / 2

  const cells = new Array(4).fill(null).map((_, index) => {
    const label = chips[index % chips.length]
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = startX + col * cellSize
    const y = startY + row * cellSize
    return `
      <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${index % 2 === 0 ? "#f8fafc" : "#eef2ff"}" stroke="#94a3b8" stroke-width="1.5" />
      <text x="${x + cellSize / 2}" y="${y + cellSize / 2}" fill="#1e293b" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="26" font-weight="700">${escapeXml(label)}</text>
    `
  })

  return {
    width: 340,
    height: 332,
    body: `
      <rect x="1" y="1" width="338" height="330" rx="18" ry="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      <text x="170" y="30" fill="#0f172a" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="700">方形间色比例</text>
      <text x="170" y="286" fill="#64748b" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="13">规律：${escapeXml(item.DML规律 || "未填写")}</text>
      <text x="170" y="307" fill="#64748b" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="13">边长：${escapeXml(String(item.边长 > 0 ? item.边长 : 1))} cm</text>
      ${cells.join("")}
    `,
  }
}

function build单项预览Svg(item: 手织图间色比例项): string {
  const block = item.type === "横排" ? create横排预览(item) : create方形预览(item)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${block.width}" height="${block.height}" viewBox="0 0 ${block.width} ${block.height}">
  ${block.body}
</svg>`
}

function build手织图汇总Svg(list: 手织图间色比例项[]): string {
  if (list.length === 0) return ""

  const blocks = list.map((item) =>
    item.type === "横排" ? create横排预览(item) : create方形预览(item),
  )
  const width = Math.max(...blocks.map((item) => item.width)) + 40
  const height = blocks.reduce((sum, item) => sum + item.height, 0) + (blocks.length - 1) * 20 + 40
  let offsetY = 20
  const body = blocks
    .map((block) => {
      const content = `<g transform="translate(${(width - block.width) / 2}, ${offsetY})">${block.body}</g>`
      offsetY += block.height + 20
      return content
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f8fafc" />
  ${body}
</svg>`
}

function create默认比例项(type: "横排" | "方形"): 手织图间色比例项 {
  if (type === "方形") {
    return {
      type: "方形",
      DML规律: "",
      边长: 1,
    }
  }

  return {
    type: "横排",
    DML规律: "",
  }
}

function normalize比例列表(
  list: 手织图间色比例项[] | undefined,
): 手织图间色比例项[] | undefined {
  return list && list.length > 0 ? list : undefined
}

export function createEmpty手织指示单测试值(): 手织指示单测试值 {
  return {
    注意事项: "",
    手织图svg: "",
    手织图比例: undefined,
  }
}

export default function HandWovenInstructionTestEditor({
  value,
  onChange,
  title = "手织指示单测试页",
  description = "左侧维护手织图类型生成列表，右侧展示横排和方形生成预览。",
}: Props) {
  const 比例列表 = value.手织图比例 ?? []
  const is特殊模式 = 比例列表.length === 0
  const 汇总Svg = React.useMemo(() => build手织图汇总Svg(比例列表), [比例列表])
  const hasSvg = Boolean(汇总Svg.trim())
  const 预览列表 = React.useMemo(
    () =>
      比例列表.map((item, index) => ({
        key: `${item.type}-${index}`,
        title: `${item.type} ${index + 1}`,
        svg: build单项预览Svg(item),
      })),
    [比例列表],
  )

  React.useEffect(() => {
    if (value.手织图svg === 汇总Svg) return
    onChange({
      ...value,
      手织图svg: 汇总Svg,
    })
  }, [onChange, value, 汇总Svg])

  function commit(nextValue: 手织指示单测试值) {
    onChange(nextValue)
  }

  function update比例列表(
    updater: (list: 手织图间色比例项[]) => 手织图间色比例项[],
  ) {
    const nextList = updater([...比例列表])
    commit({
      ...value,
      手织图svg: build手织图汇总Svg(nextList),
      手织图比例: normalize比例列表(nextList),
    })
  }

  return (
    <section className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <div className="mt-1 text-xs text-slate-500">{description}</div>
        </div>
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
                  await navigator.clipboard.writeText(JSON.stringify(value, null, 2))
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
              onClick={() =>
                downloadTextFile(
                  "hand-woven-instruction.json",
                  JSON.stringify(value, null, 2),
                  "application/json;charset=utf-8",
                )
              }
            >
              下载 JSON
            </button>
          </div>
        </details>
      </div>

      <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-3">
          <Section title="基础信息">
            <div className="space-y-3 p-3">
              <Field label="当前模式">
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {is特殊模式 ? "特殊" : `常规（共 ${比例列表.length} 项）`}
                </div>
              </Field>
              <Field label="注意事项">
                <TextInput
                  value={value.注意事项}
                  onChange={(注意事项) => commit({ ...value, 注意事项 })}
                  placeholder='例如：手织 :1.手织后帽子不能变形。'
                  multiline
                  rows={3}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="手织图类型生成"
            action={
              <div className="flex items-center gap-2">
                <AddBtn
                  label="+ 横排"
                  onClick={() =>
                    update比例列表((list) => [...list, create默认比例项("横排")])
                  }
                />
                <AddBtn
                  label="+ 方形"
                  onClick={() =>
                    update比例列表((list) => [...list, create默认比例项("方形")])
                  }
                />
              </div>
            }
          >
            <div className="space-y-3 p-3">
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600">
                这里先只维护 `手织图比例` 列表。列表为空时，表示当前按特殊手织图处理。
              </div>

              {比例列表.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  暂无手织图比例项。当前只有整张 SVG 手织图，不生成横排或方形配置。
                </div>
              ) : (
                <div className="space-y-3">
                  {比例列表.map((item, index) => (
                    <div
                      key={`${item.type}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-700">
                          {item.type} {index + 1}
                        </div>
                        <DelBtn
                          onClick={() =>
                            update比例列表((list) => list.filter((_, i) => i !== index))
                          }
                        />
                      </div>

                      <div className="space-y-3">
                        <Field label="规律">
                          <TextInput
                            value={item.DML规律}
                            onChange={(DML规律) =>
                              update比例列表((list) => {
                                const next = [...list]
                                next[index] = {
                                  ...next[index],
                                  DML规律,
                                } as 手织图间色比例项
                                return next
                              })
                            }
                            placeholder='例如：D:M:L=3:3:4 或 D,L 交替'
                          />
                        </Field>

                        {item.type === "方形" ? (
                          <Field label="边长 (cm)">
                            <NumInput
                              value={item.边长}
                              step="0.1"
                              onChange={(边长) =>
                                update比例列表((list) => {
                                  const next = [...list]
                                  next[index] = {
                                    ...item,
                                    边长: 边长 > 0 ? 边长 : 1,
                                  }
                                  return next
                                })
                              }
                            />
                          </Field>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-3">
          <Section
            title="SVG 预览"
            action={
              hasSvg ? (
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  onClick={() =>
                    downloadTextFile("hand-woven.svg", 汇总Svg, "image/svg+xml")
                  }
                >
                  下载汇总 SVG
                </button>
              ) : null
            }
          >
            <div className="space-y-3 p-3">
              <div className="text-xs text-slate-500">
                {hasSvg ? `已生成 ${预览列表.length} 张预览 SVG` : "暂无可预览的横排或方形生成结果"}
              </div>

              {预览列表.length > 0 ? (
                <div className="space-y-3">
                  {预览列表.map((preview) => (
                    <div
                      key={preview.key}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                        {preview.title}
                      </div>
                      <InlineSvg
                        svg={preview.svg}
                        className="w-full overflow-auto bg-white p-3"
                        height="auto"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  请先在左侧添加横排或方形配置，右侧会自动生成对应的 SVG 预览。
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </section>
  )
}
