import DataTable, { type Column } from "../../components/DataTable";
import InlineSvg from "../../components/InlineSvg";
import Row from "../../components/Row";
import Section from "../../components/Section";
import type { 手织指示单 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 手织指示单Frontend } from "../../shared/frontend/model/model";
import { inputCls } from "../../pages/admin/add-file/components/ui";

type Props = {
  mode: "edit" | "readonly";
  value: 手织指示单;
  onChange?: (v: 手织指示单) => void;
  previewData?: 手织指示单Frontend | null;
  showSvg?: boolean;
};

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

export default function HandWovenBlock({
  mode,
  value,
  onChange,
  previewData,
  showSvg = true,
}: Props) {
  const isEdit = mode === "edit";
  const title = previewData?.title;

  if (isEdit) {
    return (
      <div className="space-y-5">
        <Section title="手织指示单">
          <div className="space-y-4 p-4">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-700">注意事项</div>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="手织 :1.手织后帽子不能变形。"
                value={value.注意事项}
                onChange={(e) =>
                  onChange?.({ ...value, 注意事项: e.target.value })
                }
              />
            </div>

            {showSvg ? (
              <div>
                <div className="mb-1 text-xs font-medium text-slate-700">
                  手织图 SVG
                </div>
                <textarea
                  rows={5}
                  className={inputCls}
                  value={value.手织图.svg}
                  onChange={(e) =>
                    onChange?.({ ...value, 手织图: { svg: e.target.value } })
                  }
                />
              </div>
            ) : null}

            {value.手织图.svg.trim() ? (
              <div className="rounded border border-slate-100 bg-white p-3">
                <InlineSvg svg={value.手织图.svg} height={320} className="w-full" />
              </div>
            ) : null}
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {title ? (
        <Section title="标题信息">
          <div className="divide-y divide-slate-100">
            <Row label="样品编号" value={title.样品编号} />
            <Row label="客户编号" value={title.客户编号} />
            <Row label="品名" value={title.品名} />
            <Row label="CAP" value={title.CAP} />
            <Row label="尺寸" value={`${title.尺寸}`} />
            <Row label="重量" value={`${title.重量}g`} />
            <Row label="原材料" value={title.原材料} />
            <Row label="颜色编号" value={title.颜色编号} />
          </div>
        </Section>
      ) : null}

      {previewData ? (
        <Section title="人工规格清单（手织图版）">
          <div className="overflow-x-auto">
            <DataTable
              columns={规格列}
              rows={previewData.人工规格清单_手织图}
              rowKey={(r) => r.档位}
            />
          </div>
        </Section>
      ) : null}

      <Section title="手织指示单">
        <div className="space-y-4 p-4">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-700">注意事项</div>
            <div className="whitespace-pre-line rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {value.注意事项 || "—"}
            </div>
          </div>
        </div>
      </Section>

      {(previewData?.手织图片 || value.手织图.svg) ? (
        <Section title="手织图">
          <div className="p-4">
            <InlineSvg
              svg={previewData?.手织图片 ?? value.手织图.svg}
              height={320}
              className="w-full"
            />
          </div>
        </Section>
      ) : null}
    </div>
  );
}
