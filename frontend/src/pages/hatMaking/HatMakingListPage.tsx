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
import type { Db制帽 } from "../../shared/db/Db制帽";
import { frontConfig } from "../../frontConfig";

type HatMakingItem = Db制帽;
type 区域项 = { name: string; lineLength: number };

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
  const [名称, set名称] = useState("");
  const [帽围, set帽围] = useState("");
  const [帽深, set帽深] = useState("");
  const [前后, set前后] = useState("");
  const [高针图, set高针图] = useState("");
  const [手织图, set手织图] = useState("");
  const [高针图预置区域, set高针图预置区域] = useState<区域项[]>([]);
  const [手织图预置区域, set手织图预置区域] = useState<区域项[]>([]);
  const [高针新增区域名, set高针新增区域名] = useState("");
  const [高针新增线长, set高针新增线长] = useState("");
  const [手织新增区域名, set手织新增区域名] = useState("");
  const [手织新增线长, set手织新增线长] = useState("");
  const [高针图上传中, set高针图上传中] = useState(false);
  const [手织图上传中, set手织图上传中] = useState(false);

  function toServerUploadUrl(src: string): string {
    const trimmed = src.trim();
    if (!trimmed) return "";

    const fromPath = trimmed.match(/^(\/upload\/.*)$/i);
    if (fromPath) {
      return new URL(fromPath[1], frontConfig.prodServer).toString();
    }

    try {
      const parsed = new URL(trimmed);
      if (/^\/upload\//i.test(parsed.pathname)) {
        return new URL(parsed.pathname, frontConfig.prodServer).toString();
      }
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  function resolveImageUrl(src: string): string {
    return toServerUploadUrl(src);
  }

  async function uploadImage(
    file: File,
    setPath: (path: string) => void,
    setUploading: (v: boolean) => void,
  ) {
    setUploading(true);
    try {
      const fileData = new Uint8Array(await file.arrayBuffer());
      const res = (await callApi(
        "Upload" as never,
        {
          fileData,
          fileName: file.name,
          dirName: "hat-making",
        } as never,
      )) as
        | { isSucc: true; res: { path: string } }
        | { isSucc: false; err: { message: string } };
      if (!res.isSucc) {
        throw new Error(res.err.message || "上传失败");
      }
      setPath(toServerUploadUrl(res.res.path));
      message.success("图片上传成功");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "图片上传失败";
      message.error(msg);
    } finally {
      setUploading(false);
    }
  }

  const { data, loading, error, reload } = useApi<{
    list: HatMakingItem[];
    total: number;
    pageNum: number;
    pageSize: number;
  }>(
    () =>
      callApi(
        "admin/hatMaking/GetList" as never,
        {
          keyword: keyword.trim() || undefined,
          pageNum,
          pageSize,
          orderSort: "asc",
        } as never,
      ) as Promise<
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
      key: "名称",
      title: "名称",
      render: (r) => r.名称,
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
      key: "高针图",
      title: "高针图",
      render: (r) => (r.高针图 ? "有" : "无"),
    },
    {
      key: "手织图",
      title: "手织图",
      render: (r) => (r.手织图 ? "有" : "无"),
    },
    {
      key: "区域",
      title: "预置区域",
      render: (r) =>
        `高针:${r.高针图系统预置区域列表?.length ?? 0} / 手织:${r.手织图系统预置区域列表?.length ?? 0}`,
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

  function buildFinalRegionList(
    current: 区域项[],
    pendingName: string,
    pendingLineLength: string,
    label: "高针图" | "手织图",
  ): 区域项[] | null {
    const normalizedCurrent = current.map((item) => ({
      name: item.name.trim(),
      lineLength: Number(item.lineLength),
    }));

    const name = pendingName.trim();
    const hasPendingName = name.length > 0;
    const hasPendingLineLength = pendingLineLength.trim().length > 0;

    let next = normalizedCurrent;
    if (hasPendingName || hasPendingLineLength) {
      if (!hasPendingName) {
        message.error(`${label}新增区域名不能为空`);
        return null;
      }
      const lineLength = Number(pendingLineLength);
      if (!(lineLength > 0)) {
        message.error(`${label}新增区域长度必须大于0`);
        return null;
      }
      if (normalizedCurrent.some((item) => item.name === name)) {
        message.error(`${label}区域名已存在`);
        return null;
      }
      next = [...normalizedCurrent, { name, lineLength }];
    }

    if (next.some((item) => !(item.lineLength > 0))) {
      message.error(`${label}预置区域长度必须大于0`);
      return null;
    }
    if (new Set(next.map((item) => item.name)).size !== next.length) {
      message.error(`${label}预置区域名称不能重复`);
      return null;
    }

    return next;
  }

  async function handleAdd() {
    const id = 制帽编号.trim();
    const name = 名称.trim();
    const hatAround = Number(帽围);
    const hatDepth = Number(帽深);
    const frontBack = Number(前后);

    if (!id) {
      message.error("制帽编号不能为空");
      return;
    }
    if (!name) {
      message.error("制帽名称不能为空");
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
    const final高针图预置区域 = buildFinalRegionList(
      高针图预置区域,
      高针新增区域名,
      高针新增线长,
      "高针图",
    );
    if (!final高针图预置区域) return;

    const final手织图预置区域 = buildFinalRegionList(
      手织图预置区域,
      手织新增区域名,
      手织新增线长,
      "手织图",
    );
    if (!final手织图预置区域) return;

    const r = (await callApi(
      "admin/hatMaking/Add" as never,
      {
        制帽编号: id,
        名称: name,
        帽围: hatAround,
        帽深: hatDepth,
        前后: frontBack,
        高针图: 高针图.trim() || undefined,
        手织图: 手织图.trim() || undefined,
        高针图系统预置区域列表: final高针图预置区域,
        手织图系统预置区域列表: final手织图预置区域,
      } as never,
    )) as
      | { isSucc: true; res: { id: string } }
      | { isSucc: false; err: { message: string } };
    if (!r.isSucc) {
      message.error(r.err.message);
      return;
    }

    message.success("新增成功");
    setCreateOpen(false);
    set制帽编号("");
    set名称("");
    set帽围("");
    set帽深("");
    set前后("");
    set高针图("");
    set手织图("");
    set高针图预置区域([]);
    set手织图预置区域([]);
    set高针新增区域名("");
    set高针新增线长("");
    set手织新增区域名("");
    set手织新增线长("");
    navigate(`/hat-making/${r.res.id}`);
  }

  function add高针区域() {
    const name = 高针新增区域名.trim();
    const lineLength = Number(高针新增线长);
    if (!name) {
      message.error("高针图区域名不能为空");
      return;
    }
    if (!(lineLength > 0)) {
      message.error("高针图区域长度必须大于0");
      return;
    }
    if (高针图预置区域.some((item) => item.name === name)) {
      message.error("高针图区域名已存在");
      return;
    }
    set高针图预置区域((prev) => [...prev, { name, lineLength }]);
    set高针新增区域名("");
    set高针新增线长("");
  }

  function add手织区域() {
    const name = 手织新增区域名.trim();
    const lineLength = Number(手织新增线长);
    if (!name) {
      message.error("手织图区域名不能为空");
      return;
    }
    if (!(lineLength > 0)) {
      message.error("手织图区域长度必须大于0");
      return;
    }
    if (手织图预置区域.some((item) => item.name === name)) {
      message.error("手织图区域名已存在");
      return;
    }
    set手织图预置区域((prev) => [...prev, { name, lineLength }]);
    set手织新增区域名("");
    set手织新增线长("");
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
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                名称 *
              </label>
              <input
                type="text"
                className={inputCls()}
                placeholder="例如：侧分雪花网L"
                value={名称}
                onChange={(e) => set名称(e.target.value)}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  高针图
                </label>
                <div className="rounded border border-slate-200 p-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">
                      {高针图上传中 ? "上传中..." : "选择并上传"}
                      <input
                        type="file"
                        accept="image/*,.svg"
                        className="hidden"
                        disabled={高针图上传中}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void uploadImage(file, set高针图, set高针图上传中);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {高针图 ? (
                      <button
                        type="button"
                        className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                        onClick={() => set高针图("")}
                      >
                        清空
                      </button>
                    ) : null}
                  </div>
                  {高针图 ? (
                    <div className="mt-2 space-y-2">
                      <img
                        src={resolveImageUrl(高针图)}
                        alt="高针图预览"
                        className="max-h-36 w-full rounded border border-slate-100 object-contain"
                      />
                      <div className="truncate text-[11px] text-slate-500">
                        {高针图}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400">未上传</div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  手织图
                </label>
                <div className="rounded border border-slate-200 p-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">
                      {手织图上传中 ? "上传中..." : "选择并上传"}
                      <input
                        type="file"
                        accept="image/*,.svg"
                        className="hidden"
                        disabled={手织图上传中}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void uploadImage(file, set手织图, set手织图上传中);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {手织图 ? (
                      <button
                        type="button"
                        className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                        onClick={() => set手织图("")}
                      >
                        清空
                      </button>
                    ) : null}
                  </div>
                  {手织图 ? (
                    <div className="mt-2 space-y-2">
                      <img
                        src={resolveImageUrl(手织图)}
                        alt="手织图预览"
                        className="max-h-36 w-full rounded border border-slate-100 object-contain"
                      />
                      <div className="truncate text-[11px] text-slate-500">
                        {手织图}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400">未上传</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  高针图系统预置区域列表
                </label>
                <div className="max-h-56 space-y-2 overflow-auto rounded border border-slate-200 p-2">
                  {高针图预置区域.length === 0 ? (
                    <div className="text-xs text-slate-400">
                      暂无区域，先在下方新增
                    </div>
                  ) : null}
                  {高针图预置区域.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-28 text-xs text-slate-600">
                        {item.name}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={inputCls()}
                        value={item.lineLength}
                        onChange={(e) => {
                          const next = [...高针图预置区域];
                          next[index] = {
                            ...item,
                            lineLength: Number(e.target.value),
                          };
                          set高针图预置区域(next);
                        }}
                      />
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-2">
                    <div className="grid grid-cols-[1fr_8rem_auto] gap-2">
                      <input
                        type="text"
                        className={inputCls()}
                        placeholder="例如：尾巴"
                        value={高针新增区域名}
                        onChange={(e) => set高针新增区域名(e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={inputCls()}
                        placeholder="长度"
                        value={高针新增线长}
                        onChange={(e) => set高针新增线长(e.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                        onClick={add高针区域}
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  手织图系统预置区域列表
                </label>
                <div className="max-h-56 space-y-2 overflow-auto rounded border border-slate-200 p-2">
                  {手织图预置区域.length === 0 ? (
                    <div className="text-xs text-slate-400">
                      暂无区域，先在下方新增
                    </div>
                  ) : null}
                  {手织图预置区域.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-28 text-xs text-slate-600">
                        {item.name}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={inputCls()}
                        value={item.lineLength}
                        onChange={(e) => {
                          const next = [...手织图预置区域];
                          next[index] = {
                            ...item,
                            lineLength: Number(e.target.value),
                          };
                          set手织图预置区域(next);
                        }}
                      />
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-2">
                    <div className="grid grid-cols-[1fr_8rem_auto] gap-2">
                      <input
                        type="text"
                        className={inputCls()}
                        placeholder="例如：尾巴"
                        value={手织新增区域名}
                        onChange={(e) => set手织新增区域名(e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={inputCls()}
                        placeholder="长度"
                        value={手织新增线长}
                        onChange={(e) => set手织新增线长(e.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                        onClick={add手织区域}
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>
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
          <div className="space-y-4">
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
          </div>
        </StatusView>
      </div>
    </PageShell>
  );
}
