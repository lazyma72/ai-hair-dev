/**
 * 高针指示单View — 高针指示单的展示区块
 */
import DataTable, { type Column } from "../../../components/DataTable";
import InlineSvg from "../../../components/InlineSvg";
import Row from "../../../components/Row";
import Section from "../../../components/Section";
import type { 高针指示单Frontend } from "../../../shared/frontend/model/model";

type Props = { data: 高针指示单Frontend };

const 规格列: Column<高针指示单Frontend["机器规格清单_高针图"][number]>[] = [
  { key: "档位", title: "档位", render: (r) => r.档位 },
  { key: "毛长", title: "毛长", render: (r) => `${r.毛长}寸` },
  {
    key: "长度",
    title: "长度 D/M/L",
    render: (r) =>
      `D:${r.长度.D}${r.长度.M != null ? " M:" + r.长度.M : ""}${r.长度.L != null ? " L:" + r.长度.L : ""}`,
  },
  { key: "形态", title: "形态", render: (r) => r.形态 || "—" },
  { key: "管径", title: "管径", render: (r) => r.管径 || "—" },
  { key: "方向", title: "方向", render: (r) => r.方向 },
  { key: "备注", title: "备注", render: (r) => r.备注 || "—" },
];

export default function 高针指示单View({ data }: Props) {
  const { title, 高针图svg, 机器规格清单_高针图, 注意事项, 发型图片 } = data;

  return (
    <div className="space-y-5">
      {/* ── 标题信息 ── */}
      <Section title="标题信息">
        <div className="divide-y divide-slate-100">
          <Row label="样品编号" value={title.样品编号} />
          <Row label="客户编号" value={title.客户编号} />
          <Row label="品名" value={title.品名} />
          <Row label="尺寸" value={title.尺寸} />
          <Row label="原料" value={title.原料} />
          <Row label="CAP" value={title.CAP} />
          <Row label="重量" value={title.重量 || "—"} />
        </div>
      </Section>

      {/* ── 高针图 SVG ── */}
      {高针图svg && (
        <Section title="高针图">
          <div className="p-4">
            <InlineSvg svg={高针图svg} height={320} className="w-full" />
          </div>
        </Section>
      )}

      {/* ── 机器规格清单（高针图版） ── */}
      <Section title="机器规格清单（高针图版）">
        <div className="overflow-x-auto">
          <DataTable
            columns={规格列}
            rows={机器规格清单_高针图}
            rowKey={(r) => r.档位}
          />
        </div>
      </Section>

      {/* ── 注意事项 ── */}
      {注意事项 && (
        <Section title="注意事项">
          <div className="whitespace-pre-line px-4 py-3 text-xs text-slate-700">
            {注意事项}
          </div>
        </Section>
      )}

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
