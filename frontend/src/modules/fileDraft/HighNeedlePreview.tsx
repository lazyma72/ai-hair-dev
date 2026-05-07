import { useMemo, useState } from "react";
import InlineSvg from "../../components/InlineSvg";
import type { 高针图 } from "../../shared/models/高针图";
import { parseSvg, serializeSvg } from "../../utils/svgDom";

type Props = {
  value: 高针图;
};

type PreviewVisibility = {
  档位: boolean;
  车线编号: boolean;
  单双: boolean;
  DML: boolean;
};

const DEFAULT_VISIBILITY: PreviewVisibility = {
  档位: true,
  车线编号: false,
  单双: true,
  DML: true,
};

const 标注节点前缀 = {
  档位: ["level-", "__preview__/mark-gear/label/"],
  车线编号: ["stitching-", "__preview__/extract-carline/label/"],
  单双: ["double-", "double-annotation/"],
  DML: ["dml-"],
} as const;

function hideElement(element: Element | null | undefined) {
  if (!element) return;
  element.setAttribute("display", "none");
  element.setAttribute("visibility", "hidden");
  element.setAttribute("opacity", "0");
  const style = element.getAttribute("style") ?? "";
  const nextStyle = style.includes("display:none")
    ? style
    : `${style}${style ? ";" : ""}display:none;visibility:hidden;opacity:0`;
  element.setAttribute("style", nextStyle);
}

function hideNodeById(doc: Document, nodeId: string | undefined) {
  const id = String(nodeId ?? "").trim();
  if (!id) return;
  const node = doc.getElementById(id);
  hideElement(node);
}

function hideNodeByPrefixes(doc: Document, prefixes: readonly string[]) {
  prefixes.forEach((prefix) => {
    doc.querySelectorAll("[id]").forEach((node) => {
      const id = node.getAttribute("id")?.trim() ?? "";
      if (id.startsWith(prefix)) {
        hideElement(node);
      }
    });
  });
}

function getTextTarget(node: Element) {
  let target: Element = node;
  const parent = node.parentElement;
  if (
    parent &&
    parent.tagName.toLowerCase() === "g" &&
    parent.tagName.toLowerCase() !== "svg" &&
    parent.childElementCount <= 3
  ) {
    target = parent;
  }
  return target;
}

function hideTextMatches(doc: Document, matcher: (text: string) => boolean) {
  doc.querySelectorAll("text, tspan").forEach((node) => {
    const text = (node.textContent ?? "").trim();
    if (!text || !matcher(text)) return;

    const target = getTextTarget(node);
    hideElement(target);

    const previous = target.previousElementSibling;
    if (
      previous &&
      previous.parentElement === target.parentElement &&
      ["rect", "ellipse", "path"].includes(previous.tagName.toLowerCase())
    ) {
      hideElement(previous);
    }
  });
}

function build文本集合(value: 高针图) {
  const 档位 = new Set<string>();
  const 车线编号 = new Set<string>();
  const 单双 = new Set<string>();
  const DML = new Set<string>();

  value.车线.forEach((item) => {
    const level = String(item.档位 ?? "").trim();
    if (level) {
      档位.add(level);
    }

    const carlineNo = String(item.车线编号 ?? "").trim();
    if (carlineNo) {
      车线编号.add(carlineNo);
    }

    const order = String(item.编号 ?? "").trim();
    if (order) {
      车线编号.add(order);
    }

    const dml = String(item.DML ?? "").trim();
    if (dml) {
      DML.add(dml);
    }

    if (item.是双数) {
      单双.add("双");
    } else {
      单双.add("单");
    }
  });

  return { 档位, 车线编号, 单双, DML };
}

function buildPreviewSvg(value: 高针图, visibility: PreviewVisibility): string {
  const svg = value.svg?.trim() ?? "";
  if (!svg) return "";

  const doc = parseSvg(svg);
  if (!doc?.documentElement) return svg;
  const 文本集合 = build文本集合(value);

  if (!visibility.档位) {
    value.车线.forEach((item) => hideNodeById(doc, item.标注NodeId?.档位));
    hideNodeByPrefixes(doc, 标注节点前缀.档位);
    hideTextMatches(doc, (text) => 文本集合.档位.has(text));
  }

  if (!visibility.单双) {
    value.车线.forEach((item) => hideNodeById(doc, item.标注NodeId?.单双));
    hideNodeByPrefixes(doc, 标注节点前缀.单双);
    hideTextMatches(doc, (text) => 文本集合.单双.has(text));
  }

  if (!visibility.DML) {
    value.车线.forEach((item) => hideNodeById(doc, item.标注NodeId?.DML));
    hideNodeByPrefixes(doc, 标注节点前缀.DML);
    hideTextMatches(doc, (text) => 文本集合.DML.has(text));
  }

  if (!visibility.车线编号) {
    value.车线.forEach((item) => hideNodeById(doc, item.标注NodeId?.车线编号));
    hideNodeByPrefixes(doc, 标注节点前缀.车线编号);
    hideTextMatches(doc, (text) => 文本集合.车线编号.has(text));
  }

  return serializeSvg(doc);
}

export default function HighNeedlePreview({ value }: Props) {
  const [visibility, setVisibility] = useState<PreviewVisibility>(DEFAULT_VISIBILITY);
  const previewSvg = useMemo(
    () => buildPreviewSvg(value, visibility),
    [value, visibility],
  );

  if (!value.svg?.trim()) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        {(["档位", "车线编号", "单双", "DML"] as const).map((key) => (
          <label key={key} className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={visibility[key]}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setVisibility((prev) => ({
                  ...prev,
                  [key]: checked,
                }));
              }}
            />
            {key}
          </label>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-slate-100 bg-white">
        <InlineSvg svg={previewSvg} className="w-full" height="auto" />
      </div>
    </div>
  );
}
