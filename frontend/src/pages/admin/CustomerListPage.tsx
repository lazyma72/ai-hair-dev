import * as React from "react";
import { message } from "antd";
import { useMemo, useState } from "react";
import { callApi } from "../../api/callApi";
import type { Column } from "../../components/DataTable";
import DataTable from "../../components/DataTable";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { DbCustomer } from "../../shared/db/DbCustomer";

export default function CustomerListPage() {
  const [keyword, setKeyword] = useState("");
  const [newCustomerNo, setNewCustomerNo] = useState("");

  const fetcher = useMemo(
    () => () =>
      callApi("admin/customer/GetList", { keyword: keyword || undefined }),
    [keyword],
  );

  const { data, loading, error, reload } = useApi(fetcher);
  const list = data?.list ?? [];

  const columns: Column<DbCustomer>[] = [
    {
      key: "客户编号",
      title: "客户编号",
      render: (r) => <span className="font-mono font-medium">{r.客户编号}</span>,
    },
    {
      key: "action",
      title: "",
      width: "80px",
      render: (r) => (
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
          onClick={() => {
            void navigator.clipboard.writeText(r.客户编号);
            message.success("已复制客户编号");
          }}
        >
          复制
        </button>
      ),
    },
  ];

  async function handleAdd() {
    const val = newCustomerNo.trim();
    if (!val) {
      message.error("客户编号不能为空");
      return;
    }

    const r = await callApi("admin/customer/Add", { 客户编号: val });
    if (!r.isSucc) {
      message.error(r.err.message);
      return;
    }

    message.success("新增成功");
    setNewCustomerNo("");
    reload();
  }

  return (
    <PageShell title="客户管理">
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-72">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                查询
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="输入客户编号关键词"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={reload}
            >
              查询
            </button>
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => {
                setKeyword("");
                reload();
              }}
            >
              清空
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-72">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                新增客户编号 *
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="例如：XM"
                value={newCustomerNo}
                onChange={(e) => setNewCustomerNo(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => void handleAdd()}
            >
              新增
            </button>
          </div>
        </div>

        <StatusView
          loading={loading}
          error={error}
          empty={list.length === 0}
          emptyText="暂无客户"
        >
          <DataTable columns={columns} rows={list} rowKey={(r) => r._id} />
        </StatusView>
      </div>
    </PageShell>
  );
}
