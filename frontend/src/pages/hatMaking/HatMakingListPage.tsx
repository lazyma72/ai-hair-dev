import { message, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import type { Column } from "../../components/DataTable";
import DataTable from "../../components/DataTable";
import PageShell from "../../components/PageShell";
import PaginationBar from "../../components/PaginationBar";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";

type HatMakingItem = {
  _id: string;
  帽围: number;
  帽深: number;
  前后: number;
};

function inputCls() {
  return "w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";
}

export default function HatMakingListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [制帽编号, set制帽编号] = useState("");
  const [帽围, set帽围] = useState("");
  const [帽深, set帽深] = useState("");
  const [前后, set前后] = useState("");

  const { data, loading, error, reload } = useApi<{
    list: HatMakingItem[];
    total: number;
    pageNum: number;
    pageSize: number;
  }>(() =>
    callApi("admin/hatMaking/GetList" as never, {
      keyword: keyword.trim() || undefined,
      pageNum,
      pageSize,
      orderSort: "asc",
    } as never) as Promise<
      | {
          isSucc: true;
          res: {
            list: HatMakingItem[];
            total: number;
            pageNum: number;
            pageSize: number;
          };
        }
      | { isSucc: false; err: { message: string } }
    >,
  );

  useEffect(() => {
    void reload();
  }, [keyword, pageNum, pageSize, reload]);

  const list = useMemo<HatMakingItem[]>(() => data?.list ?? [], [data]);
  const total = data?.total ?? 0;

  const columns: Column<HatMakingItem>[] = [
    {
      key: "_id",
      title: "制帽编号",
      render: (r) => <span className="font-mono font-medium">{r._id}</span>,
    },
    {
      key: "帽围",
      title: "帽围 (cm)",
      render: (r) => r.帽围,
    },
    {
      key: "帽深",
      title: "帽深 (cm)",
      render: (r) => r.帽深,
    },
    {
      key: "前后",
      title: "前后 (cm)",
      render: (r) => r.前后,
    },
    {
      key: "action",
      title: "",
      width: "80px",
      render: (r) => (
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
          onClick={() => navigate(`/hat-making/${r._id}`)}
        >
          查看
        </button>
      ),
    },
  ];

  async function handleAdd() {
    const id = 制帽编号.trim();
    const hatAround = Number(帽围);
    const hatDepth = Number(帽深);
    const frontBack = Number(前后);

    if (!id) {
      message.error("制帽编号不能为空");
      return;
    }
    if (!(hatAround > 0)) {
      message.error("帽围必须大于0");
      return;
    }
    if (!(hatDepth > 0)) {
      message.error("帽深必须大于0");
      return;
    }
    if (!(frontBack > 0)) {
      message.error("前后必须大于0");
      return;
    }

    const r = (await callApi("admin/hatMaking/Add" as never, {
      制帽编号: id,
      帽围: hatAround,
      帽深: hatDepth,
      前后: frontBack,
    } as never)) as
      | { isSucc: true; res: { id: string } }
      | { isSucc: false; err: { message: string } };
    if (!r.isSucc) {
      message.error(r.err.message);
      return;
    }

    message.success("新增成功");
    setCreateOpen(false);
    set制帽编号("");
    set帽围("");
    set帽深("");
    set前后("");
    navigate(`/hat-making/${r.res.id}`);
  }

  return (
    <PageShell
      title="制帽管理"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => setCreateOpen(true)}
        >
          + 新增制帽
        </button>
      }
    >
      <div className="space-y-3">
        <Modal
          title="新增制帽"
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          okText="新增"
          cancelText="取消"
          onOk={() => void handleAdd()}
        >
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                制帽编号 *
              </label>
              <input
                type="text"
                className={inputCls()}
                placeholder="例如：HM-001"
                value={制帽编号}
                onChange={(e) => set制帽编号(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  帽围 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={inputCls()}
                  value={帽围}
                  onChange={(e) => set帽围(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  帽深 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={inputCls()}
                  value={帽深}
                  onChange={(e) => set帽深(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  前后 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={inputCls()}
                  value={前后}
                  onChange={(e) => set前后(e.target.value)}
                />
              </div>
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
                className={inputCls()}
                placeholder="输入制帽编号关键词"
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
          emptyText="暂无制帽数据"
        >
          <DataTable columns={columns} rows={list} rowKey={(r) => r._id} />
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
        </StatusView>
      </div>
    </PageShell>
  );
}
