[OPEN] high-needle-lag

# Debug Session: high-needle-lag

## Symptoms
- 高针图 SVG 标注中，文本节点拖动卡顿。
- 鼠标沿线滑动勾选线条卡顿。
- 用户希望交互流畅度接近 Figma。

## Scope
- `frontend/src/modules/highNeedleAnnotator/*`

## Hypotheses
1. `mousemove` 期间触发了高频 React state 更新，导致整块画布反复重渲染。
2. 刷线命中逻辑频繁调用 `elementsFromPoint()` 与 SVG 查询，主线程开销过高。
3. 文本拖动过程中持续读写 SVG DOM 与布局信息，触发强制回流。
4. 叠加层标记与 SVG 本体同时更新，造成一次鼠标移动对应多条渲染链路。
5. 缩放、装饰线条、标记过滤等 `useMemo/useEffect` 在拖动/刷线期间失效重算。

## Evidence Plan
- 为拖动、刷线、重算、自动补标增加运行时打点。
- 记录单次交互中的事件频率、耗时、重渲染触发次数。
- 对比拖动前、中、后的关键阶段耗时，确认瓶颈位置。

## Status
- Waiting for instrumentation.
