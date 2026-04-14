import * as React from "react";
import { message } from "antd";
import { useMemo, useState } from "react";
import PageShell from "../../components/PageShell";

type UserRole = "管理员" | "录入" | "查看";

type UserItem = {
  id: string;
  account: string;
  password: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
};

const LS_KEY = "demo_users";

function loadUsers(): UserItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const val = JSON.parse(raw);
    return Array.isArray(val) ? (val as UserItem[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(list: UserItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function maskPassword(pwd: string) {
  if (!pwd) return "—";
  return "•".repeat(Math.min(12, pwd.length));
}

export default function UserManagementPage() {
  const [list, setList] = useState<UserItem[]>(() => {
    const stored = loadUsers();
    if (stored.length > 0) return stored;
    return [
      {
        id: "u-001",
        account: "admin",
        password: "123456",
        role: "管理员",
        enabled: true,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: "u-002",
        account: "operator",
        password: "123456",
        role: "录入",
        enabled: true,
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ];
  });

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("查看");

  const accountExists = useMemo(
    () => list.some((u) => u.account === account.trim()),
    [account, list],
  );

  function persist(next: UserItem[]) {
    setList(next);
    saveUsers(next);
  }

  function handleAdd() {
    const acc = account.trim();
    const pwd = password.trim();
    if (!acc || !pwd) {
      message.error("账号和密码不能为空");
      return;
    }
    if (accountExists) {
      message.error("账号已存在");
      return;
    }

    const next: UserItem[] = [
      {
        id: `u-${String(list.length + 1).padStart(3, "0")}`,
        account: acc,
        password: pwd,
        role,
        enabled: true,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...list,
    ];
    persist(next);
    setAccount("");
    setPassword("");
    setRole("查看");
    message.success("新增成功（Demo）");
  }

  function toggleEnabled(id: string) {
    const next = list.map((u) =>
      u.id === id ? { ...u, enabled: !u.enabled } : u,
    );
    persist(next);
  }

  return (
    <PageShell title="用户管理（静态 Demo）">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">新增用户</div>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              账号
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="例如：alice"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
            {accountExists ? (
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
            <select
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="管理员">管理员</option>
              <option value="录入">录入</option>
              <option value="查看">查看</option>
            </select>
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

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          用户列表
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">账号</th>
                <th className="px-4 py-2 text-left font-medium">密码</th>
                <th className="px-4 py-2 text-left font-medium">角色</th>
                <th className="px-4 py-2 text-left font-medium">状态</th>
                <th className="px-4 py-2 text-left font-medium">创建时间</th>
                <th className="px-4 py-2 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((u) => (
                <tr key={u.id} className="text-slate-700">
                  <td className="px-4 py-2 font-mono">{u.account}</td>
                  <td className="px-4 py-2 font-mono text-slate-400">
                    {maskPassword(u.password)}
                  </td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">
                    {u.enabled ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        启用
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {u.createdAt}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="rounded bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
                      onClick={() => toggleEnabled(u.id)}
                    >
                      {u.enabled ? "禁用" : "启用"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        说明：该页面仅做账号密码管理的静态 Demo，数据保存在浏览器 LocalStorage。
      </div>
    </PageShell>
  );
}
