/**
 * PageShell — 页面外壳
 *
 * 提供统一头部导航 + 标题行（含可选返回按钮）+ 子内容区域。
 * - 导航栏目仅包含业务模块入口，不包含“登录”。
 * - 右上角展示登录状态（用户/退出登录）。
 */
import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { callApi } from "../api/callApi";
import {
  clearToken,
  getAuthUserProfile,
  isLoggedIn,
  setAuthUserProfile,
} from "../auth";

type NavItem = {
  label: string;
  to: string;
  end?: boolean;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    group: "工作台",
    items: [{ label: "首页", to: "/welcome", end: true }],
  },
  {
    group: "设计稿",
    items: [{ label: "设计稿管理", to: "/designs", end: true }],
  },
  {
    group: "管理",
    items: [
      { label: "制帽管理", to: "/hat-making" },
      { label: "胶丝比例", to: "/ratio" },
      { label: "客户管理", to: "/customers" },
      { label: "用户管理", to: "/users" },
    ],
  },
  {
    group: "工具",
    items: [{ label: "测试页面", to: "/test" }],
  },
];

const flatNavItems = NAV_GROUPS.flatMap((g) => g.items);

type Props = {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** 需要容纳大画布（如高针标注）时可开启 */
  fullWidth?: boolean;
  compact?: boolean;
};

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

function getAvatarText(name: string, username: string): string {
  const normalizedName = name.trim();
  if (normalizedName) {
    return normalizedName.slice(0, 1).toUpperCase();
  }
  return username.trim().slice(0, 1).toUpperCase() || "U";
}

export default function PageShell({ title, onBack, actions, children, fullWidth, compact = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const iconSrc = `${import.meta.env.BASE_URL}icon.png`;
  const profileLoadAttemptedRef = React.useRef(false);

  const containerMaxWidthCls = fullWidth ? "max-w-none" : "max-w-7xl";

  const loggedIn = isLoggedIn();
  const profile = loggedIn ? getAuthUserProfile() : null;
  const displayName = profile?.name?.trim() || profile?.username?.trim() || "已登录用户";
  const avatarText = getAvatarText(profile?.name || "", profile?.username || "");

  React.useEffect(() => {
    if (!loggedIn) {
      profileLoadAttemptedRef.current = false;
      return;
    }

    if (profile) {
      profileLoadAttemptedRef.current = false;
      return;
    }

    if (profileLoadAttemptedRef.current) {
      return;
    }

    profileLoadAttemptedRef.current = true;
    let cancelled = false;

    void callApi("Me" as never, {} as never).then((result: any) => {
      if (!result.isSucc || cancelled) {
        return;
      }

      setAuthUserProfile({ name: result.res.name, username: result.res.username });
    });

    return () => {
      cancelled = true;
    };
  }, [loggedIn, profile]);

  const isLoginPage = location.pathname === "/login";
  const showNav = loggedIn;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div
          className={`mx-auto flex ${containerMaxWidthCls} items-center justify-between gap-4 px-4 ${
            compact ? "py-2 sm:px-5" : "py-3 sm:px-6"
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={iconSrc}
              alt="沐茵丝"
              className={`${compact ? "h-8 w-8" : "h-9 w-9"} rounded-lg object-contain`}
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">
                AI 设计稿工作台
              </div>
              <div className="text-xs text-slate-500">
                成品稿 / 制帽 / 胶丝比例 / 客户管理（Demo）
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showNav ? (
              <nav className="hidden items-center gap-1 lg:flex">
                {flatNavItems.map((item) => (
                  <NavItemLink key={item.to} item={item} />
                ))}
              </nav>
            ) : null}

            <div className="flex items-center gap-2">
              {loggedIn ? (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {avatarText}
                    </div>
                    <div className="min-w-0 text-sm text-slate-700">
                      <div className="truncate font-medium text-slate-900">{displayName}</div>
                      <div className="truncate text-xs text-slate-500">{profile?.username || "当前账号"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                    onClick={() => {
                      clearToken();
                      navigate("/login", { replace: true });
                    }}
                  >
                    退出登录
                  </button>
                </>
              ) : isLoginPage ? (
                <div className="text-sm text-slate-400">未登录</div>
              ) : (
                <button
                  type="button"
                  className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  onClick={() => navigate("/login")}
                >
                  去登录
                </button>
              )}
            </div>
          </div>
        </div>

        {showNav ? (
          <div
            className={`mx-auto ${containerMaxWidthCls} overflow-x-auto px-4 ${
              compact ? "pb-2 sm:px-5" : "pb-3 sm:px-6"
            } lg:hidden`}
          >
            <div className="flex w-max items-center gap-1">
              {flatNavItems.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main
        className={`mx-auto ${containerMaxWidthCls} ${
          compact ? "space-y-3 p-3 sm:p-4" : "space-y-5 p-4 sm:p-6"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onBack ? (
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-900"
                onClick={onBack}
              >
                ←
              </button>
            ) : null}
            <h1 className={`${compact ? "text-lg" : "text-xl"} font-semibold text-slate-900`}>{title}</h1>
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>

        {children}
      </main>
    </div>
  );
}
