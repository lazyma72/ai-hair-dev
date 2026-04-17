import type { 制品规格书 } from "../../shared/db/Db沐茵丝假发成品稿";
import type {
  手织指示单Frontend,
  高针指示单Frontend,
} from "../../shared/frontend/model/model";
import { formatInchText } from "../../pages/admin/add-file/components/DyeLevelEditor";

type MachineRow = 制品规格书["机器规格清单"][number];
type ManualRow = 制品规格书["人工规格清单"][number];

function fmtNum(value: number | undefined) {
  if (value == null) return "—";
  return value.toFixed(2);
}

function fmtFrac(value: number | undefined) {
  if (value == null) return "—";
  const n = Math.round(value * 4) / 4;
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 4);
  const fracStr = ["", "\u00bc", "\u00bd", "\u00be"][frac] ?? "";
  if (whole === 0 && !fracStr) return "0";
  if (whole === 0) return fracStr;
  return fracStr ? `${whole}${fracStr}` : String(whole);
}

function Cell({
  children,
  rowSpan,
  align = "center",
  narrow = false,
}: {
  children: React.ReactNode;
  rowSpan?: number;
  align?: "left" | "center";
  narrow?: boolean;
}) {
  return (
    <td
      rowSpan={rowSpan}
      className={`border border-slate-300 px-1 py-1 text-[11px] leading-tight text-slate-800 ${
        narrow ? "min-w-[3.75rem] tabular-nums" : "min-w-[4.5rem]"
      } ${
        align === "left"
          ? "text-left align-top"
          : "text-center align-middle tabular-nums"
      }`}
    >
      {children}
    </td>
  );
}

function Header({
  children,
  colSpan,
  rowSpan,
  narrow = false,
}: {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  narrow?: boolean;
}) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`border border-slate-300 bg-slate-100 px-1 py-1 text-center text-[11px] font-semibold leading-tight text-slate-700 ${
        narrow ? "min-w-[3.75rem]" : "min-w-[4.5rem]"
      }`}
    >
      {children}
    </th>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
      <table className="min-w-[980px] w-full border-collapse bg-white text-xs">
        {children}
      </table>
    </div>
  );
}

export function ExcelStyleMachineTable({ rows }: { rows: MachineRow[] }) {
  const showM = rows.some(
    (row) =>
      row.双针.尺数.M != null ||
      row.裁断与重量.some((item) => item.重量g?.M != null),
  );
  const show对裁 = rows.some((row) => row.整毛.对裁 != null);
  const colSpan =
    1 + 1 + (show对裁 ? 2 : 1) + (showM ? 3 : 2) + (showM ? 5 : 4) + 1 + 3 + 1;

  return (
    <TableShell>
      <thead>
        <tr>
          <Header rowSpan={2}>档位</Header>
          <Header rowSpan={2} narrow>
            裁断
          </Header>
          <Header colSpan={show对裁 ? 2 : 1}>整毛</Header>
          <Header colSpan={showM ? 3 : 2}>重量 g</Header>
          <Header colSpan={showM ? 5 : 4}>双针</Header>
          <Header rowSpan={2}>形态</Header>
          <Header colSpan={3}>美容</Header>
          <Header rowSpan={2}>备注</Header>
        </tr>
        <tr>
          <Header narrow>拉尖</Header>
          {show对裁 ? <Header narrow>对裁</Header> : null}
          <Header narrow>D</Header>
          {showM ? <Header narrow>M</Header> : null}
          <Header narrow>L</Header>
          <Header narrow>毛长</Header>
          <Header narrow>尺数 D</Header>
          {showM ? <Header narrow>尺数 M</Header> : null}
          <Header narrow>尺数 L</Header>
          <Header narrow>密度</Header>
          <Header narrow>铝管</Header>
          <Header>方向</Header>
          <Header narrow>层数</Header>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={colSpan}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              暂无机器规格清单
            </td>
          </tr>
        ) : (
          rows.flatMap((row) => {
            const cutRows =
              row.裁断与重量.length > 0 ? row.裁断与重量 : [{ 裁断: 0 }];
            return cutRows.map((item, index) => (
              <tr key={`${row.档位 || "row"}-${index}`} className="bg-white">
                {index === 0 ? (
                  <Cell rowSpan={cutRows.length}>{row.档位 || "—"}</Cell>
                ) : null}
                <Cell narrow>{fmtNum(item.裁断)}</Cell>
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtFrac(row.整毛.拉尖)}
                    </Cell>
                    {show对裁 ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {fmtFrac(row.整毛.对裁)}
                      </Cell>
                    ) : null}
                  </>
                ) : null}
                <Cell narrow>{fmtNum(item.重量g?.D)}</Cell>
                {showM ? <Cell narrow>{fmtNum(item.重量g?.M)}</Cell> : null}
                <Cell narrow>{fmtNum(item.重量g?.L)}</Cell>
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtFrac(row.双针.毛长)}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtNum(row.双针.尺数.D)}
                    </Cell>
                    {showM ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {fmtNum(row.双针.尺数.M)}
                      </Cell>
                    ) : null}
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtNum(row.双针.尺数.L)}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtNum(row.双针.密度)}
                    </Cell>
                    <Cell rowSpan={cutRows.length}>{row.形态 || "—"}</Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtNum(row.美容.铝管)}
                    </Cell>
                    <Cell rowSpan={cutRows.length}>{row.美容.方向 || "—"}</Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtNum(row.美容.层数)}
                    </Cell>
                    <Cell rowSpan={cutRows.length} align="left">
                      {row.备注 || "—"}
                    </Cell>
                  </>
                ) : null}
              </tr>
            ));
          })
        )}
      </tbody>
    </TableShell>
  );
}

export function ExcelStyleManualTable({ rows }: { rows: ManualRow[] }) {
  const showM = rows.some((row) =>
    row.裁断与重量.some((item) => item.重量g?.M != null),
  );
  const show对裁 = rows.some((row) => row.整毛.对裁 != null);
  const colSpan =
    1 + 1 + (show对裁 ? 2 : 1) + (showM ? 3 : 2) + 3 + 1 + 1 + 1 + 1;

  return (
    <TableShell>
      <thead>
        <tr>
          <Header rowSpan={2}>档位</Header>
          <Header rowSpan={2} narrow>
            裁断
          </Header>
          <Header colSpan={show对裁 ? 2 : 1}>整毛</Header>
          <Header colSpan={showM ? 3 : 2}>重量 g</Header>
          <Header colSpan={3}>双针</Header>
          <Header rowSpan={2}>形态</Header>
          <Header rowSpan={2}>美容铝管</Header>
          <Header rowSpan={2}>位置</Header>
          <Header rowSpan={2}>备注</Header>
        </tr>
        <tr>
          <Header narrow>拉尖</Header>
          {show对裁 ? <Header narrow>对裁</Header> : null}
          <Header narrow>D</Header>
          {showM ? <Header narrow>M</Header> : null}
          <Header narrow>L</Header>
          <Header narrow>毛长</Header>
          <Header narrow>磅发</Header>
          <Header narrow>密度</Header>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={colSpan}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              暂无人工规格清单
            </td>
          </tr>
        ) : (
          rows.flatMap((row) => {
            const cutRows =
              row.裁断与重量.length > 0 ? row.裁断与重量 : [{ 裁断: 0 }];
            return cutRows.map((item, index) => (
              <tr key={`${row.档位 || "row"}-${index}`} className="bg-white">
                {index === 0 ? (
                  <Cell rowSpan={cutRows.length}>{row.档位 || "—"}</Cell>
                ) : null}
                <Cell narrow>{fmtNum(item.裁断)}</Cell>
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtFrac(row.整毛.拉尖)}
                    </Cell>
                    {show对裁 ? (
                      <Cell rowSpan={cutRows.length} narrow>
                        {fmtFrac(row.整毛.对裁)}
                      </Cell>
                    ) : null}
                  </>
                ) : null}
                <Cell narrow>{fmtNum(item.重量g?.D)}</Cell>
                {showM ? <Cell narrow>{fmtNum(item.重量g?.M)}</Cell> : null}
                <Cell narrow>{fmtNum(item.重量g?.L)}</Cell>
                {index === 0 ? (
                  <>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtFrac(row.双针.毛长)}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {row.双针.磅发 != null ? `磅${row.双针.磅发}g/扎` : "—"}
                    </Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtNum(row.双针.密度)}
                    </Cell>
                    <Cell rowSpan={cutRows.length}>{row.形态 || "—"}</Cell>
                    <Cell rowSpan={cutRows.length} narrow>
                      {fmtNum(row.美容.铝管)}
                    </Cell>
                    <Cell rowSpan={cutRows.length}>{row.位置 || "—"}</Cell>
                    <Cell rowSpan={cutRows.length} align="left">
                      {row.备注 || "—"}
                    </Cell>
                  </>
                ) : null}
              </tr>
            ));
          })
        )}
      </tbody>
    </TableShell>
  );
}

type HighNeedleImageRow = 高针指示单Frontend["机器规格清单_高针图"][number];
type HandWovenImageRow = 手织指示单Frontend["人工规格清单_手织图"][number];

function fmtIntLike(value: number | undefined) {
  if (value == null) return "";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function fmtInchCell(value: number | undefined) {
  if (value == null) return "";
  return formatInchText(value);
}

export function ExcelStyleHighNeedleImageTable({
  rows,
}: {
  rows: HighNeedleImageRow[];
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          <Header rowSpan={2} narrow>
            档位
          </Header>
          <Header rowSpan={2} narrow>
            毛长
          </Header>
          <Header colSpan={3}>长度</Header>
          <Header rowSpan={2} narrow>
            形态
          </Header>
          <Header rowSpan={2} narrow>
            管径 Φ
          </Header>
          <Header rowSpan={2} narrow>
            方向
          </Header>
          <Header rowSpan={2}>备注</Header>
        </tr>
        <tr>
          <Header narrow>D</Header>
          <Header narrow>M</Header>
          <Header narrow>L</Header>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={9}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              暂无机器规格清单（高针图版）
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.档位 || Math.random()} className="bg-white">
              <Cell narrow>{row.档位 || "—"}</Cell>
              <Cell narrow>{fmtInchCell(row.毛长)}</Cell>
              <Cell narrow>{fmtIntLike(row.长度.D)}</Cell>
              <Cell narrow>{fmtIntLike(row.长度.M)}</Cell>
              <Cell narrow>{fmtIntLike(row.长度.L)}</Cell>
              <Cell>{row.形态 || ""}</Cell>
              <Cell narrow>{fmtIntLike(row.管径)}</Cell>
              <Cell>{row.方向 || ""}</Cell>
              <Cell align="left">{row.备注 || ""}</Cell>
            </tr>
          ))
        )}
      </tbody>
    </TableShell>
  );
}

export function ExcelStyleHandWovenImageTable({
  rows,
}: {
  rows: HandWovenImageRow[];
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          <Header rowSpan={2} narrow>
            档位
          </Header>
          <Header rowSpan={2} narrow>
            整毛
          </Header>
          <Header rowSpan={2} narrow>
            毛长
          </Header>
          <Header colSpan={3}>重量: g</Header>
          <Header rowSpan={2}>备注</Header>
        </tr>
        <tr>
          <Header narrow>D</Header>
          <Header narrow>M</Header>
          <Header narrow>L</Header>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              className="border border-slate-300 px-4 py-6 text-center text-xs text-slate-400"
            >
              暂无人工规格清单（手织图版）
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.档位 || Math.random()} className="bg-white">
              <Cell narrow>{row.档位 || "—"}</Cell>
              <Cell narrow>{fmtIntLike(row.整长)}</Cell>
              <Cell narrow>{fmtInchCell(row.毛长)}</Cell>
              <Cell narrow>{fmtIntLike(row.重量.D)}</Cell>
              <Cell narrow>{fmtIntLike(row.重量.M)}</Cell>
              <Cell narrow>{fmtIntLike(row.重量.L)}</Cell>
              <Cell align="left">{row.位置 || ""}</Cell>
            </tr>
          ))
        )}
      </tbody>
    </TableShell>
  );
}
