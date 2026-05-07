# EditorShell Portable Bundle

这个目录用于把当前项目里的 `EditorShell` 以及它依赖的本地代码，打包成一个可拷贝的 `src/` 子树。

## 生成方式

在项目根目录执行：

```bash
node src/layers/view/edit/collectDeps.mjs
```

脚本会把依赖文件复制到：

```
src/layers/view/edit/src/
```

并保持与原项目 `src/` 完全一致的路径结构，所以相对 import 不需要改。

## 复制到其他项目

把 `src/layers/view/edit/src/` 下面的内容整体复制到你的目标项目的 `src/` 下。

默认入口参考：

- `src/App.tsx`（已包含 `EditorProvider` + `EditorShell`）
- `src/App.css`（包含 EditorShell 所需样式）

## 需要的 npm 依赖（你可自行安装）

- `react`
- `react-dom`
- `fabric`
- `react-colorful`

