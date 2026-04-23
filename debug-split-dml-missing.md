# Debug Session: split-dml-missing
- **Status**: [OPEN]
- **Issue**: `GenerateByAB` 的上下分生成后图上没有 DML 标记
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: `.dbg/trae-debug-log-split-dml-missing.ndjson`

## Reproduction Steps
1. 调用 `admin/file/GenerateByAB`，让 `fileB.假发类型 === 上下分`
2. 查看返回的 `fileC.高针指示单.高针图` / `fileC.手织指示单.手织图`
3. 确认图上是否存在 DML 标记

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `生成上下分图稿` 已写入规则，但前端展示不读取 `DML规则命令列表` | High | Med | Pending |
| B | B 稿规则没有可映射的 `lineNodeIds`，导致映射结果为空 | High | Low | Pending |
| C | A/B 图区域名或线条顺序不匹配，映射后命中极少或为 0 | Med | Med | Pending |
| D | 图稿中的 DML 规则在后续构建/返回阶段被覆盖掉 | Med | Low | Pending |

## Log Evidence
[Pending]

## Verification Conclusion
[Pending]
