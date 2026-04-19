import * as React from "react";
import { useMemo, useState } from "react";
import InlineSvg from "./InlineSvg";
import type { 高针图 } from "../shared/models/高针图";
import { 空DML规则, type DML规则 } from "../shared/models/DML规则";

type Props = {
  value: 高针图;
  onChange: (v: 高针图) => void;
};

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsText(file);
  });
}

function normalizeDML规则(raw自定义数据: Record<string, unknown>): DML规则 {
  const raw规则 = raw自定义数据["DML规则"];
  if (raw规则 && typeof raw规则 === "object") {
    const obj = raw规则 as Record<string, unknown>;
    const 命令列表 = Array.isArray(obj["命令列表"]) ? obj["命令列表"] : [];
    return {
      命令列表: 命令列表.filter(Boolean) as DML规则["命令列表"],
    };
  }

  return 空DML规则();
}

function normalize高针图(raw: unknown): 高针图 {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const raw底图 = (obj["底图"] && typeof obj["底图"] === "object"
    ? (obj["底图"] as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const raw自定义数据 = (obj["自定义数据"] && typeof obj["自定义数据"] === "object"
    ? (obj["自定义数据"] as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const svg = typeof raw底图["svg"] === "string" ? (raw底图["svg"] as string) : "";

  const 区域名 = Array.isArray(raw底图["区域名"])
    ? (raw底图["区域名"] as unknown[]).filter((x) => typeof x === "string")
    : [];

  const 区域线条 = Array.isArray(raw底图["区域线条"])
    ? (raw底图["区域线条"] as unknown[]).filter(Boolean)
    : [];

  const 档位标注 = Array.isArray(raw底图["档位标注"])
    ? (raw底图["档位标注"] as unknown[]).filter(Boolean)
    : [];

  const 文本节点 =
    raw底图["文本节点"] && typeof raw底图["文本节点"] === "object"
      ? (raw底图["文本节点"] as Record<string, unknown>)
      : {};

  const 单双标注 = Array.isArray(raw自定义数据["单双标注"])
    ? (raw自定义数据["单双标注"] as unknown[]).filter(Boolean)
    : [];

  return {
    底图: {
      svg,
      区域名,
      区域线条: 区域线条 as 高针图["底图"]["区域线条"],
      档位标注: 档位标注 as 高针图["底图"]["档位标注"],
      文本节点: 文本节点 as 高针图["底图"]["文本节点"],
    },
    自定义数据: {
      DML规则: normalizeDML规则(raw自定义数据),
      单双标注: 单双标注 as 高针图["自定义数据"]["单双标注"],
    },
  };
}

export default function HighNeedleJsonImporter({ value, onChange }: Props) {
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");

  const hasSvg = useMemo(() => Boolean(value.底图.svg?.trim()), [value.底图.svg]);

  function applyJson(text: string) {
    try {
      const parsed = JSON.parse(text) as unknown;
      const normalized = normalize高针图(parsed);
      if (!normalized.底图.svg.trim()) {
        setError("JSON 缺少 底图.svg，无法导入");
        return;
      }
      onChange(normalized);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON 解析失败");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        建议流程：打开“高针标注/高针预览”工具生成 JSON → 回到这里导入。标注逻辑不在此页面改动。
        <div className="mt-1 flex flex-wrap gap-3">
          <a
            className="text-slate-700 underline hover:text-slate-900"
            href="/test/high-needle-annotator"
            target="_blank"
            rel="noreferrer"
          >
            打开高针标注工具
          </a>
          <a
            className="text-slate-700 underline hover:text-slate-900"
            href="/test/high-needle-preview"
            target="_blank"
            rel="noreferrer"
          >
            打开高针预览工具（导入/下载 JSON）
          </a>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-700">导入 JSON</div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void readFileText(file).then((text) => {
                  setRawText(text);
                  applyJson(text);
                });
              }}
            />
          </div>
          <textarea
            rows={10}
            className="w-full rounded border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="粘贴高针图 JSON..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              onClick={() => applyJson(rawText)}
            >
              导入
            </button>
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200"
              onClick={() => {
                setRawText("");
                setError("");
              }}
            >
              清空输入
            </button>
            {hasSvg ? (
              <span className="text-xs text-emerald-700">已导入 SVG</span>
            ) : (
              <span className="text-xs text-slate-400">未导入</span>
            )}
          </div>
          {error ? (
            <div className="mt-2 text-xs text-rose-700">{error}</div>
          ) : null}
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-700">预览</div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            {hasSvg ? (
              <InlineSvg svg={value.底图.svg} height={320} className="w-full" />
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                暂无高针图
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
