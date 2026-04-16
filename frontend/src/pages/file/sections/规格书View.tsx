/**
 * 规格书View — 制品规格书的展示区块
 *
 * 对应 制品规格书Frontend 类型，分区块展示各字段。
 *
 * 如何改？
 *   - 增加字段：在对应 Section 中加一行 <Row>
 *   - 调整机器/人工规格清单预览：修改 ExcelStyleSpecTables 组件
 */
import DataTable, { type Column } from "../../../components/DataTable";
import InlineSvg from "../../../components/InlineSvg";
import Row from "../../../components/Row";
import Section from "../../../components/Section";
import {
  ExcelStyleMachineTable,
  ExcelStyleManualTable,
} from "../../../modules/fileDraft/ExcelStyleSpecTables";
import {
  buildPreviewSvg,
  formatInchText,
} from "../../admin/add-file/components/DyeLevelEditor";
import type { KLS胶丝比例 } from "../../../shared/db/Db胶丝比例";
import type { 染色档位 } from "../../../shared/db/Db沐茵丝假发成品稿";
import type { 制品规格书Frontend } from "../../../shared/frontend/model/model";
import { 数字转分数字符串 } from "../../../shared/models/分数转换";

type Props = { data: 制品规格书Frontend };

// 胶丝配比表格列定义
const 配比列: Column<KLS胶丝比例>[] = [
  { key: "发丝种类", title: "发丝种类", render: (r) => r.发丝种类 },
  { key: "色号", title: "色号", render: (r) => r.色号 },
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
];

function 染色档位卡片({ item, index }: { item: 染色档位; index: number }) {
  const previewSvg = buildPreviewSvg(item);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">
            染色档位 {index + 1}（{item.type}）
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.染色图.档位标注.档位列表.map((slot) => (
              <span
                key={slot}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-3">
          <div className="rounded bg-slate-50 px-3 py-2">
            染色尺寸：{formatInchText(item.染色图.染色尺寸标注.尺寸)}
          </div>
          {item.type === "错位" ? (
            <div className="rounded bg-slate-50 px-3 py-2">
              长尺寸：{formatInchText(item.染色图.长尺寸标注.尺寸)}
            </div>
          ) : null}
          {item.type === "错位" && item.染色图.短尺寸标注 ? (
            <div className="rounded bg-slate-50 px-3 py-2">
              短尺寸：{formatInchText(item.染色图.短尺寸标注.尺寸)}
            </div>
          ) : null}
        </div>
      </div>

      {previewSvg ? (
        <div className="overflow-x-auto rounded border border-slate-100 bg-white p-3">
          <InlineSvg svg={previewSvg} className="max-w-full" height="auto" />
        </div>
      ) : null}
    </div>
  );
}

export default function 规格书View({ data }: Props) {
  const normalized = data as unknown as 制品规格书Frontend & {
    胶丝比例: 制品规格书Frontend extends { 胶丝比例: infer T } ? T : any;
    制帽: { 帽围: number; 帽深: number; 前后: number; 唛头: string; 编号: string };
  };
  const {
    title,
    制帽,
    当前重量,
    工程重量,
    工艺说明,
    机器规格清单,
    人工规格清单,
    胶丝比例,
    发型图片,
    染色档位列表,
  } = normalized;

  return (
    <div className="space-y-5">
      {/* ── 标题信息 ── */}
      <Section title="标题信息">
        <div className="divide-y divide-slate-100">
          <Row label="样品编号" value={title.样品编号} />
          <Row label="客户编号" value={title.客户编号} />
          <Row label="品名" value={title.品名} />
          <Row label="订单" value={title.订单 || "—"} />
          <Row label="原料" value={title.原料} />
          <Row label="颜色编号" value={title.颜色编号} />
        </div>
      </Section>

      {/* ── 制帽规格 ── */}
      <Section title="制帽规格">
        <div className="divide-y divide-slate-100">
          {(
            [
              ["帽围", `${制帽.帽围} cm`],
              ["帽深", `${制帽.帽深} cm`],
              ["前后", `${制帽.前后} cm`],
              ["唛头", 制帽.唛头],
              ["编号", 制帽.编号],
            ] as const
          ).map(([k, v]) => (
            <Row key={k} label={k} value={v} />
          ))}
        </div>
      </Section>

      {/* ── 机器规格清单 ── */}
      <Section title="机器规格清单">
        <div className="p-4">
          <ExcelStyleMachineTable rows={机器规格清单} />
        </div>
      </Section>

      {/* ── 人工规格清单 ── */}
      <Section title="人工规格清单">
        <div className="p-4">
          <ExcelStyleManualTable rows={人工规格清单} />
        </div>
      </Section>

      {/* ── 胶丝比例列表 ── */}
      {胶丝比例 ? (
        <Section title="胶丝比例">
          <div className="mb-4">
            <div className="divide-y divide-slate-100 px-4 py-2 text-xs">
              <Row label="颜色编号" value={胶丝比例._id.颜色编号} />
              <Row label="发丝种类" value={胶丝比例._id.发丝种类} />
              {胶丝比例.线色 ? <Row label="线色" value={胶丝比例.线色} /> : null}
              {胶丝比例.备注 ? <Row label="备注" value={胶丝比例.备注} /> : null}
            </div>
            <div className="space-y-2 px-4">
              {胶丝比例.D.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-500">D</div>
                  <DataTable columns={配比列} rows={胶丝比例.D} rowKey={(r) => r.色号} />
                </div>
              )}
              {胶丝比例.M && 胶丝比例.M.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-500">M</div>
                  <DataTable columns={配比列} rows={胶丝比例.M} rowKey={(r) => r.色号} />
                </div>
              )}
              {胶丝比例.L && 胶丝比例.L.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-500">L</div>
                  <DataTable columns={配比列} rows={胶丝比例.L} rowKey={(r) => r.色号} />
                </div>
              )}
            </div>
          </div>
        </Section>
      ) : null}

      {/* ── 工程重量 ── */}
      <Section title={`工程重量（当前重量：${当前重量}g）`}>
        <div className="px-5 py-3 text-xs text-slate-500">
          备注：手织重量 = 制帽的加减 + 手织的加减。
        </div>
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-[7rem_6rem_1fr] gap-2 px-4 py-2 text-xs text-slate-400">
            <span>项目</span>
            <span>加减</span>
            <span>重量</span>
          </div>
          {(
            Object.entries(工程重量) as [
              string,
              { 加减: number; 数值: number } | string,
            ][]
          )
            .filter(([k]) => k !== "重量")
            .map(([k, v]) => {
              if (typeof v === "string") return null;
              return (
                <div
                  key={k}
                  className="grid grid-cols-[7rem_6rem_1fr] gap-2 px-4 py-2 text-xs"
                >
                  <span className="text-slate-400">{k}</span>
                  <span className="text-slate-900">
                    {v.加减 >= 0 ? "+" : ""}
                    {v.加减}
                  </span>
                  <span className="text-slate-900">{v.数值}g</span>
                </div>
              );
            })}
        </div>
        <div className="flex items-center justify-between bg-slate-900 px-5 py-2.5 text-xs text-white">
          <span className="text-slate-300">合计重量</span>
          <span className="font-semibold">{工程重量.重量}</span>
        </div>
      </Section>

      {染色档位列表.length > 0 ? (
        <Section title="染色档位列表">
          <div className="space-y-3 p-4">
            {染色档位列表.map((item, index) => (
              <染色档位卡片
                key={`${item.type}-${index}-${item.染色图.档位标注.textNodeId}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── 工艺说明 ── */}
      <Section title="工艺说明">
        <div className="px-4 py-3 text-xs">
          {(Object.entries(工艺说明) as [string, string][]).map(([k, v]) => (
            <Row key={k} label={k} value={v} />
          ))}
        </div>
      </Section>

      {/* ── 发型图片 ── */}
      {发型图片.length > 0 && (
        <Section title="发型图片">
          <div className="flex flex-wrap gap-3 p-4">
            {发型图片.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`发型图 ${i + 1}`}
                className="h-40 rounded object-contain ring-1 ring-slate-200"
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
