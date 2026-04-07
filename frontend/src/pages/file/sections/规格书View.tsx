/**
 * 规格书View — 制品规格书的展示区块
 *
 * 对应 制品规格书Frontend 类型，分区块展示各字段。
 *
 * 如何改？
 *   - 增加字段：在对应 Section 中加一行 <Row>
 *   - 调整机器规格清单列：修改下方 columns 数组
 */
import DataTable, { type Column } from "../../../components/DataTable";
import Row from "../../../components/Row";
import Section from "../../../components/Section";
import type { KLS胶丝比例 } from "../../../shared/db/Db胶丝比例";
import type { 制品规格书Frontend } from "../../../shared/frontend/model/model";

type Props = { data: 制品规格书Frontend };

// 机器规格清单的表格列定义
const 机器规格列: Column<制品规格书Frontend["机器规格清单"][number]>[] = [
  { key: "档位", title: "档位", render: (r) => r.档位 },
  {
    key: "裁断",
    title: "裁断 / 重量 D",
    render: (r) =>
      r.裁断与重量.map((x) => `${x.裁断}→${x.重量g?.D ?? "-"}g`).join("  "),
  },
  {
    key: "整毛",
    title: "整毛(拉尖/对裁)",
    render: (r) =>
      `${r.整毛.拉尖}${r.整毛.对裁 != null ? " / " + r.整毛.对裁 : ""}`,
  },
  {
    key: "形态",
    title: "形态",
    render: (r) => r.形态 ?? "—",
  },
  {
    key: "双针",
    title: "双针 毛长/尺D/密度",
    render: (r) => `${r.双针.毛长}寸 · D:${r.双针.尺数.D} · ${r.双针.密度}`,
  },
  {
    key: "美容",
    title: "美容 铝管/方向/层数",
    render: (r) => `${r.美容.铝管}mm · ${r.美容.方向} · ${r.美容.层数}层`,
  },
  { key: "备注", title: "备注", render: (r) => r.备注 ?? "—" },
];

// 人工规格清单的表格列定义
const 人工规格列: Column<制品规格书Frontend["人工规格清单"][number]>[] = [
  { key: "档位", title: "档位", render: (r) => r.档位 },
  {
    key: "裁断",
    title: "裁断 / 重量 D",
    render: (r) =>
      r.裁断与重量.map((x) => `${x.裁断}→${x.重量g?.D ?? "-"}g`).join("  "),
  },
  {
    key: "整毛",
    title: "整毛(拉尖/对裁)",
    render: (r) =>
      `${r.整毛.拉尖}${r.整毛.对裁 != null ? " / " + r.整毛.对裁 : ""}`,
  },
  {
    key: "形态",
    title: "形态",
    render: (r) => r.形态 ?? "—",
  },
  {
    key: "双针",
    title: "双针 毛长/磅发",
    render: (r) => `${r.双针.毛长}寸 / ${r.双针.磅发}g`,
  },
  { key: "美容", title: "美容 铝管", render: (r) => `${r.美容.铝管}mm` },
  { key: "位置", title: "位置", render: (r) => r.位置 ?? "—" },
  { key: "备注", title: "备注", render: (r) => r.备注 ?? "—" },
];

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

export default function 规格书View({ data }: Props) {
  const {
    title,
    制帽,
    当前重量,
    工程重量,
    工艺说明,
    机器规格清单,
    人工规格清单,
    胶丝比例列表,
    发型图片,
  } = data;

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
        <div className="grid grid-cols-3 gap-px bg-slate-100 text-xs sm:grid-cols-5">
          {(
            [
              ["帽围", `${制帽.帽围} cm`],
              ["帽深", `${制帽.帽深} cm`],
              ["前后", `${制帽.前后} cm`],
              ["唛头", 制帽.唛头],
              ["号码", 制帽.号码],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="bg-white px-4 py-3">
              <div className="text-[10px] text-slate-400">{k}</div>
              <div className="mt-0.5 font-semibold text-slate-900">{v}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 工程重量 ── */}
      <Section title={`工程重量（当前重量：${当前重量}g）`}>
        <div className="grid grid-cols-5 gap-px bg-slate-100 text-xs sm:grid-cols-10">
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
                <div key={k} className="bg-white px-2 py-3 text-center">
                  <div className="text-[10px] text-slate-400">{k}</div>
                  <div className="mt-0.5 font-semibold text-slate-800">
                    {v.数值}g
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {v.加减 >= 0 ? "+" : ""}
                    {v.加减}
                  </div>
                </div>
              );
            })}
        </div>
        <div className="flex items-center justify-between bg-slate-900 px-5 py-2.5 text-xs text-white">
          <span className="text-slate-300">合计重量</span>
          <span className="font-semibold">{工程重量.重量}</span>
        </div>
      </Section>

      {/* ── 机器规格清单 ── */}
      <Section title="机器规格清单">
        <div className="overflow-x-auto">
          <DataTable
            columns={机器规格列}
            rows={机器规格清单}
            rowKey={(r) => r.档位}
          />
        </div>
      </Section>

      {/* ── 人工规格清单 ── */}
      <Section title="人工规格清单">
        <div className="overflow-x-auto">
          <DataTable
            columns={人工规格列}
            rows={人工规格清单}
            rowKey={(r) => r.档位}
          />
        </div>
      </Section>

      {/* ── 胶丝比例列表 ── */}
      {胶丝比例列表.length > 0 && (
        <Section title="胶丝比例">
          {胶丝比例列表.map((item) => (
            <div
              key={`${item._id.颜色编号}-${item._id.发丝种类}`}
              className="mb-4"
            >
              <div className="flex items-center gap-4 px-4 py-2 text-xs text-slate-500">
                <span>
                  颜色编号：
                  <span className="font-medium text-slate-900">
                    {item._id.颜色编号}
                  </span>
                </span>
                <span>
                  发丝种类：
                  <span className="font-medium text-slate-900">
                    {item._id.发丝种类}
                  </span>
                </span>
                {item.线色 && (
                  <span>
                    线色：
                    <span className="font-medium text-slate-900">
                      {item.线色}
                    </span>
                  </span>
                )}
                {item.备注 && <span>备注：{item.备注}</span>}
              </div>
              <div className="grid gap-2 px-4 sm:grid-cols-3">
                {item.D.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-500">
                      D
                    </div>
                    <DataTable
                      columns={配比列}
                      rows={item.D}
                      rowKey={(r) => r.色号}
                    />
                  </div>
                )}
                {item.M && item.M.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-500">
                      M
                    </div>
                    <DataTable
                      columns={配比列}
                      rows={item.M}
                      rowKey={(r) => r.色号}
                    />
                  </div>
                )}
                {item.L && item.L.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-500">
                      L
                    </div>
                    <DataTable
                      columns={配比列}
                      rows={item.L}
                      rowKey={(r) => r.色号}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── 工艺说明 ── */}
      <Section title="工艺说明">
        <div className="divide-y divide-slate-100">
          {工艺说明.map((item, i) => (
            <div key={i} className="px-4 py-3 text-xs">
              {(Object.entries(item) as [string, string][]).map(([k, v]) => (
                <Row key={k} label={k} value={v} />
              ))}
            </div>
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
