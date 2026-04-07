# ai-hair-dev / frontend

本目录是 React + Vite 的前端工程，通过 tsrpc-browser 调用后端接口。

## 启动与构建

在仓库根目录下：

- 开发：`cd frontend && npm install && npm run dev`
- 构建：`cd frontend && npm run build`
- 预览：`cd frontend && npm run preview`

> 本地开发时 Vite 已将 `/api` 代理到 `http://localhost:3000`，详见 `frontend/vite.config.ts`。

## 目录结构（核心）

- `src/App.tsx`：路由入口（保持路径命名统一：`/file/:id`、`/ratio/:id`、`/admin/files`；历史的复数路径仅做重定向兜底）
- `src/components/`：可复用通用组件（如 `PageShell`、`StatusView`、`DataTable`）
- `src/pages/`：业务页面
  - `pages/file/`：成品稿列表/详情
  - `pages/ratio/`：胶丝比例列表/详情
  - `pages/admin/`：管理后台（成品稿新增等）
- `src/api/`：接口调用封装（`callApi`）
- `src/hooks/`：通用 hooks（如 `useApi`）
- `src/shared/`：共享类型与协议（指向后端 `backend/src/shared`，请保持向下兼容）

## 约定

- 页面统一使用 `PageShell` 作为外壳，保证导航栏与标题区一致。
- 交互反馈优先使用 Ant Design 的 `message`（成功/失败/校验提示）。
