import * as React from "react";
import { message } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import Badge from "../../components/Badge";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { 沐茵丝假发成品稿ListItem } from "../../shared/frontend/model/model";

const LS_HIDDEN = "demo_design_hidden_ids";
const LS_ALIAS = "demo_design_alias_map";

type AliasMap = Record<string, string>;

function readHiddenIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_HIDDEN);
    if (!raw) return [];
    const val = JSON.parse(raw);
    return Array.isArray(val) ? val.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeHiddenIds(ids: string[]) {
  localStorage.setItem(LS_HIDDEN, JSON.stringify(ids));
}

function readAliasMap(): AliasMap {
  try {
    const raw = localStorage.getItem(LS_ALIAS);
    if (!raw) return {};
    const val = JSON.parse(raw);
    return val && typeof val === "object" ? (val as AliasMap) : {};
  } catch {
    return {};
  }
}

function writeAliasMap(map: AliasMap) {
  localStorage.setItem(LS_ALIAS, JSON.stringify(map));
}

export default function DesignDraftListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => readHiddenIds());
  const [aliasMap, setAliasMap] = useState<AliasMap>(() => readAliasMap());

  const { data, loading, error, reload } = useApi(() => callApi("file/GetList", {}));
  const list = useMemo<沐茵丝假发成品稿ListItem[]>(() => data?.list ?? [], [data]);

  const filteredList = useMemo(() => {
    const kw = keyword.trim();
    return list
      .filter((x) => !hiddenIds.includes(x._id))
      .filter((x) =>
        !kw
          ? true
          : `${x._id} ${x.客户编号} ${x.品名} ${x.CAP}`
              .toLowerCase()
              .includes(kw.toLowerCase()),
      );
  }, [hiddenIds, keyword, list]);

  function handleHide(id: string) {
    if (!window.confirm("确认删除？（Demo：仅从列表隐藏，不影响数据）")) return;
    const next = Array.from(new Set([...hiddenIds, id]));
    setHiddenIds(next);
    writeHiddenIds(next);
    message.success("已删除（Demo：已从列表隐藏）");
  }

  function handleEditAlias(item: 沐茵丝假发成品稿ListItem) {
    const cur = aliasMap[item._id] ?? "";
    const next = window.prompt("编辑显示名称（Demo）", cur);
    if (next === null || next === undefined) return;
    const map = { ...aliasMap, [item._id]: next };
    setAliasMap(map);
    writeAliasMap(map);
    message.success("已保存（Demo）");
  }

  return (
    <PageShell
      title="设计稿管理"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => navigate("/designs/create")}
        >
          + 添加设计稿
        </button>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-80">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              搜索
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="支持：ID / 客户编号 / 品名 / CAP"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={reload}
            >
              刷新
            </button>
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => {
                setKeyword("");
                setHiddenIds([]);
                setAliasMap({});
                localStorage.removeItem(LS_HIDDEN);
                localStorage.removeItem(LS_ALIAS);
              }}
            >
              重置（Demo）
            </button>
          </div>
        </div>
      </div>

      <StatusView
        loading={loading}
        error={error}
        empty={filteredList.length === 0}
        emptyText="暂无设计稿"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {aliasMap[item._id] || item.品名}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {item.客户编号} · CAP: {item.CAP}
                  </div>
                </div>
                <Badge>{item.假发类型}</Badge>
              </div>

              <div className="mt-3 font-mono text-[10px] text-slate-300">
                {item._id}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  onClick={() => navigate(`/file/${item._id}`)}
                >
                  查看详情
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200"
                  onClick={() => handleEditAlias(item)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="rounded bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
                  onClick={() => handleHide(item._id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </StatusView>
    </PageShell>
  );
}
