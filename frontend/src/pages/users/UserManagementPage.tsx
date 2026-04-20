import { message, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import PaginationBar from "../../components/PaginationBar";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { ResGetList } from "../../shared/protocols/admin/user/PtlGetList";

type UserListItem = ResGetList["list"][number];

function formatDateTime(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export default function UserManagementPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, loading, error, reload } = useApi(() =>
    callApi("admin/user/GetList", {}),
  );
  const list = (data?.list ?? []) as UserListItem[];

  const usernameExists = useMemo(
    () => list.some((u) => u.username === username.trim()),
    [username, list],
  );
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedList = useMemo<UserListItem[]>(() => {
    const start = (pageNum - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, pageNum, pageSize]);

  useEffect(() => {
    if (pageNum > totalPages) {
      setPageNum(totalPages);
    }
  }, [pageNum, totalPages]);

  async function handleAdd() {
    const displayName = name.trim();
    const acc = username.trim();
    const pwd = password.trim();
    if (!displayName || !acc || !pwd) {
      message.error("姓名、账号和密码不能为空");
      return;
    }
    if (usernameExists) {
      message.error("账号已存在");
      return;
    }

    const r = await callApi("admin/user/Add", {
      name: displayName,
      username: acc,
      password: pwd,
    });
    if (!r.isSucc) {
      message.error(r.err.message);
      return;
    }

    reload();
    setPageNum(1);
    setName("");
    setUsername("");
    setPassword("");
    setCreateOpen(false);
    message.success("新增成功");
  }

  async function handleDelete(id: string) {
    const r = await callApi("admin/user/Delete", { id });
    if (!r.isSucc) {
      message.error(r.err.message);
      return;
    }

    reload();
    message.success("删除成功");
  }

  return (
    <PageShell
      title="用户管理"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => setCreateOpen(true)}
        >
          + 新增用户
        </button>
      }
    >
      <Modal
        title="新增用户"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        okText="新增"
        cancelText="取消"
        onOk={handleAdd}
        destroyOnClose={false}
      >
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              姓名
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="例如：系统管理员"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              账号
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="例如：admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {usernameExists ? (
              <div className="mt-1 text-xs text-rose-600">账号已存在</div>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              密码
            </label>
            <input
              type="password"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="例如：123456"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              角色
            </label>
            <input
              type="text"
              disabled
              className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none"
              value="admin"
            />
          </div>
        </div>
      </Modal>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          用户列表
        </div>
        <StatusView
          loading={loading}
          error={error}
          empty={list.length === 0}
          emptyText="暂无用户数据"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">ID</th>
                  <th className="px-4 py-2 text-left font-medium">姓名</th>
                  <th className="px-4 py-2 text-left font-medium">账号</th>
                  <th className="px-4 py-2 text-left font-medium">密码</th>
                  <th className="px-4 py-2 text-left font-medium">角色</th>
                  <th className="px-4 py-2 text-left font-medium">创建时间</th>
                  <th className="px-4 py-2 text-left font-medium">更新时间</th>
                  <th className="px-4 py-2 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedList.map((u) => (
                  <tr key={u._id.toString()} className="text-slate-700">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">
                      {u._id.toString()}
                    </td>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2 font-mono">{u.username}</td>
                    <td className="px-4 py-2 font-mono text-slate-400">
                      {"******"}
                    </td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {formatDateTime(new Date(u.createTime))}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {formatDateTime(new Date(u.updateTime))}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        className="rounded bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100"
                        onClick={() => void handleDelete(u._id.toString())}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4">
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

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        说明：该页面按 `DbUser` 结构展示，当前通过后端真实接口进行新增、查询、删除。
      </div>
    </PageShell>
  );
}
