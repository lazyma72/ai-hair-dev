import { message, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";
import { callApi } from "../../api/callApi";
import type { Column } from "../../components/DataTable";
import DataTable from "../../components/DataTable";
import PageShell from "../../components/PageShell";
import PaginationBar from "../../components/PaginationBar";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { DbCustomer } from "../../shared/db/DbCustomer";

export default function CustomerListPage() {
  const [keyword, setKeyword] = useState("");
  const [newCustomerNo, setNewCustomerNo] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetcher = useMemo(
    () => () =>
      callApi("admin/customer/GetList", { keyword: keyword || undefined }),
    [keyword],
  );

  const { data, loading, error, reload } = useApi(fetcher);
  const list = data?.list ?? [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedList = useMemo(() => {
    const start = (pageNum - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, pageNum, pageSize]);

  useEffect(() => {
    if (pageNum > totalPages) {
      setPageNum(totalPages);
    }
  }, [pageNum, totalPages]);

  const columns: Column<DbCustomer>[] = [
    {
      key: "客户编号",
      title: "客户编号",
      render: (r) => <span className="font-mono font-medium">{r.客户编号}</span>,
    },
    {
      key: "客户名称",
      title: "客户名称",
      render: (r) => r.客户名称 || "—",
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
    const no = newCustomerNo.trim();
    const name = newCustomerName.trim();
    if (!no) {
      message.error("客户编号不能为空");
      return;
    }
    if (!name) {
      message.error("客户名称不能为空");
      return;
    }

    const r = await callApi("admin/customer/Add", {
      客户编号: no,
      客户名称: name,
    });
    if (!r.isSucc) {
      message.error(r.err.message);
      return;
    }

    message.success("新增成功");
    setPageNum(1);
    setNewCustomerNo("");
    setNewCustomerName("");
    setCreateOpen(false);
    reload();
  }

  return (
    <PageShell
      title="客户管理"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => setCreateOpen(true)}
        >
          + 新增客户
        </button>
      }
    >
      <div className="space-y-3">
        <Modal
          title="新增客户"
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          okText="新增"
          cancelText="取消"
          onOk={() => void handleAdd()}
        >
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                客户编号 *
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="例如：XM"
                value={newCustomerNo}
                onChange={(e) => setNewCustomerNo(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                客户名称 *
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="例如：Museen Hair"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
            </div>
          </div>
        </Modal>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-72">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                查询
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="输入客户编号或客户名称关键词"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPageNum(1);
                }}
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
                setPageNum(1);
                reload();
              }}
            >
              清空
            </button>
          </div>
        </div>

        <StatusView
          loading={loading}
          error={error}
          empty={list.length === 0}
          emptyText="暂无客户"
        >
          <div className="space-y-4">
            <DataTable columns={columns} rows={pagedList} rowKey={(r) => r._id} />
            <PaginationBar
              total={total}
              pageNum={pageNum}
              pageSize={pageSize}
              onPageNumChange={setPageNum}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageNum(1);
              }}
            />
          </div>
        </StatusView>
      </div>
    </PageShell>
  );
}
