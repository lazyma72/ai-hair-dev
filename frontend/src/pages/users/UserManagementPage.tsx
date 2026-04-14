import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/PageShell";
import PaginationBar from "../../components/PaginationBar";
import type { DbUser } from "../../shared/db/DbUser";

const LS_KEY = "demo_users";

type StoredUser = Omit<DbUser, "createTime" | "updateTime"> & {
  createTime: string;
  updateTime: string;
};

function reviveUser(raw: StoredUser): DbUser {
  return {
    ...raw,
    createTime: new Date(raw.createTime),
    updateTime: new Date(raw.updateTime),
  };
}

function serializeUser(user: DbUser): StoredUser {
  return {
    ...user,
    createTime: user.createTime.toISOString(),
    updateTime: user.updateTime.toISOString(),
  };
}

function formatDateTime(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function loadUsers(): DbUser[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const val = JSON.parse(raw);
    return Array.isArray(val)
      ? (val as StoredUser[]).map(reviveUser)
      : [];
  } catch {
    return [];
  }
}

function saveUsers(list: DbUser[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list.map(serializeUser)));
}

function maskPassword(pwd: string) {
  if (!pwd) return "—";
  return "•".repeat(Math.min(12, pwd.length));
}

export default function UserManagementPage() {
  const [list, setList] = useState<DbUser[]>(() => {
    const stored = loadUsers();
    if (stored.length > 0) return stored;
    const now = new Date();
    return [
      {
        _id: "u-001",
        name: "系统管理员",
        username: "admin",
        password: "123456",
        role: "admin",
        createTime: now,
        updateTime: now,
      },
      {
        _id: "u-002",
        name: "演示管理员",
        username: "operator",
        password: "123456",
        role: "admin",
        createTime: now,
        updateTime: now,
      },
    ];
  });

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const usernameExists = useMemo(
    () => list.some((u) => u.username === username.trim()),
    [username, list],
  );
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

  function persist(next: DbUser[]) {
    setList(next);
    saveUsers(next);
  }

  function handleAdd() {
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

    const now = new Date();
    const next: DbUser[] = [
      {
        _id: `u-${String(list.length + 1).padStart(3, "0")}`,
        name: displayName,
        username: acc,
        password: pwd,
        role: "admin",
        createTime: now,
        updateTime: now,
      },
      ...list,
    ];
    persist(next);
    setPageNum(1);
    setName("");
    setUsername("");
    setPassword("");
    setShowCreateForm(false);
    message.success("新增成功（Demo）");
  }

  function handleDelete(id: string) {
    const next = list.filter((u) => u._id !== id);
    persist(next);
    message.success("删除成功（Demo）");
  }

  return (
    <PageShell
      title="用户管理"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          {showCreateForm ? "收起表单" : "+ 新增用户"}
        </button>
      }
    >
      {showCreateForm ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">新增用户</div>
          <div className="mt-3 grid gap-3 lg:grid-cols-5">
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

            <div className="flex items-end">
              <button
                type="button"
                className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                onClick={handleAdd}
              >
                新增
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          用户列表
        </div>
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
                <tr key={u._id} className="text-slate-700">
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">
                    {u._id}
                  </td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2 font-mono">{u.username}</td>
                  <td className="px-4 py-2 font-mono text-slate-400">
                    {maskPassword(u.password)}
                  </td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {formatDateTime(u.createTime)}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {formatDateTime(u.updateTime)}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="rounded bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100"
                      onClick={() => handleDelete(u._id)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 pt-0">
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
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        说明：该页面按 `DbUser` 结构展示，当前仍为前端静态 Demo，数据保存在浏览器 LocalStorage。
      </div>
    </PageShell>
  );
}
