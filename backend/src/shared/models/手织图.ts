export type 手织图类型 = "横排" | "方形" | "特殊"
export type 手织图比例键 = "D" | "M" | "L"

export interface 手织图比例项 {
  /* 单位0.5，可手动修改0.1 */
  值: number
  是否染色?: boolean
  remark?: string
  sort: number
}

export interface 手织图比值 {
  D: 手织图比例项
  M?: 手织图比例项
  L?: 手织图比例项
}

export interface 手织图 {
  /** SVG 字符串 */
  svg: string
  类型:
    | {
        type: "横排"
        /* 横排整体分组节点ID */
        groupNodeId: string
        比值: 手织图比值
      }
    | {
        type: "方形"
        /* 方形整体分组节点ID */
        groupNodeId: string
        比值: 手织图比值
      }
    | {
        type: "特殊"
        /* 特殊直接修改手织图 */
      }
}

export interface 手织图系统预置区域 {
  name: string
  lineLength: number
}

export const 手织图系统预置区域列表: 手织图系统预置区域[] = [
  { name: "尾巴", lineLength: 10 },
  { name: "松颈", lineLength: 20 },
  { name: "耳朵", lineLength: 30 },
  { name: "竖车", lineLength: 40 },
  { name: "横车", lineLength: 50 },
]
