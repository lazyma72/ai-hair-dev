import * as React from "react";
import { message } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import { setToken } from "../../auth";
import { hashPassword } from "../../utils/password";

type LoginState = {
  from?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LoginState | null) ?? null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const iconSrc = `${import.meta.env.BASE_URL}icon.png`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      message.error("请输入账号和密码");
      return;
    }

    setLoading(true);
    const result = await callApi("Login", {
      username: username.trim(),
      password: await hashPassword(password),
    });
    setLoading(false);

    if (!result.isSucc) {
      message.error(result.err.message);
      return;
    }

    setToken(result.res.token);
    message.success("登录成功");
    navigate(state?.from || "/welcome", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo + 品牌 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src={iconSrc}
            alt="沐茵丝"
            className="h-16 w-16 rounded-2xl object-contain shadow-sm"
          />
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              AI 设计稿工作台
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              成品稿 / 制帽 / 胶丝比例 / 客户管理
            </div>
          </div>
        </div>

        {/* 登录卡片 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">
            账号密码登录
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                账号
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                密码
              </label>
              <input
                type="password"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
