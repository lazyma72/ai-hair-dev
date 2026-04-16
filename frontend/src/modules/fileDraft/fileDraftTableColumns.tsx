import type { Column } from "../../components/DataTable";
import type { 制品规格书 } from "../../shared/db/Db沐茵丝假发成品稿";
import { 数字转分数字符串 } from "../../shared/models/分数转换";

export const machineColumns: Column<制品规格书["机器规格清单"][number]>[] = [
  { key: "档位", title: "档位", render: (row) => row.档位 },
  {
    key: "裁断与重量",
    title: "裁断 / 重量",
    render: (row) =>
      row.裁断与重量
        .map((item) => `${item.裁断} → D:${item.重量g?.D ?? "-"}g`)
        .join("  "),
  },
  {
    key: "整毛",
    title: "整毛",
    render: (row) =>
      `${数字转分数字符串(row.整毛.拉尖)}${
        row.整毛.对裁 != null
          ? ` / ${数字转分数字符串(row.整毛.对裁)}`
          : ""
      }`,
  },
  {
    key: "双针",
    title: "双针",
    render: (row) =>
      `${数字转分数字符串(row.双针.毛长)}寸 · D:${row.双针.尺数.D} · 密度:${row.双针.密度}`,
  },
  { key: "形态", title: "形态", render: (row) => row.形态 ?? "—" },
  { key: "备注", title: "备注", render: (row) => row.备注 ?? "—" },
];

export const manualColumns: Column<制品规格书["人工规格清单"][number]>[] = [
  { key: "档位", title: "档位", render: (row) => row.档位 },
  {
    key: "裁断与重量",
    title: "裁断 / 重量",
    render: (row) =>
      row.裁断与重量
        .map((item) => `${item.裁断} → D:${item.重量g?.D ?? "-"}g`)
        .join("  "),
  },
  {
    key: "整毛",
    title: "整毛",
    render: (row) =>
      `${数字转分数字符串(row.整毛.拉尖)}${
        row.整毛.对裁 != null
          ? ` / ${数字转分数字符串(row.整毛.对裁)}`
          : ""
      }`,
  },
  {
    key: "双针",
    title: "双针",
    render: (row) =>
      `${数字转分数字符串(row.双针.毛长)}寸 · ${row.双针.磅发}g`,
  },
  { key: "位置", title: "位置", render: (row) => row.位置 ?? "—" },
  { key: "备注", title: "备注", render: (row) => row.备注 ?? "—" },
];
