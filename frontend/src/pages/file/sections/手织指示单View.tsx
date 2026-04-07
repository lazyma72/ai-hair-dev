/**
 * 手织指示单View — 手织指示单的展示区块
 */
import DataTable, { type Column } from "../../../components/DataTable";
import InlineSvg from "../../../components/InlineSvg";
import Row from "../../../components/Row";
import Section from "../../../components/Section";
import type { 手织指示单Frontend } from "../../../shared/frontend/model/model";

type Props = { data: 手织指示单Frontend };

const 规格列: Column<手织指示单Frontend["人工规格清单_手织图"][number]>[] = [
  { key: "档位", title: "档位", render: (r) => r.档位 },
  { key: "整长", title: "整长", render: (r) => r.整长 || "—" },
  { key: "毛长", title: "毛长", render: (r) => r.毛长 || "—" },
  {
    key: "重量",
    title: "重量 D/M/L",
    render: (r) =>
      `D:${r.重量.D}${r.重量.M != null ? " M:" + r.重量.M : ""}${r.重量.L != null ? " L:" + r.重量.L : ""}`,
  },
];

export default function 手织指示单View({ data }: Props) {
  const { title, 人工规格清单_手织图, 手织图片 } = data;

  return (
    <div className="space-y-5">
      {/* ── 标题信息 ── */}
      <Section title="标题信息">
        <div className="divide-y divide-slate-100">
          <Row label="样品编号" value={title.样品编号} />
          <Row label="客户" value={title.客户} />
          <Row label="品名" value={title.品名} />
          <Row label="CAP" value={title.CAP} />
          <Row label="尺寸" value={`${title.尺寸}`} />
          <Row label="重量" value={`${title.重量}g`} />
          <Row label="原材料" value={title.原材料} />
          <Row label="颜色编号" value={title.颜色编号} />
          <Row label="针法" value={title.针法 || "—"} />
        </div>
      </Section>

      {/* ── 手织图 ── */}
      {手织图片 && (
        <Section title="手织图">
          <div className="p-4">
            <InlineSvg svg={手织图片} height={320} className="w-full" />
          </div>
        </Section>
      )}

      {/* ── 人工规格清单（手织图版） ── */}
      <Section title="人工规格清单（手织图版）">
        <div className="overflow-x-auto">
          <DataTable
            columns={规格列}
            rows={人工规格清单_手织图}
            rowKey={(r) => r.档位}
          />
        </div>
      </Section>
    </div>
  );
}
