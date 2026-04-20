export type DML值 = "D" | "M" | "L"

export const DML值列表: DML值[] = ["D", "M", "L"]

export type DML规则命令 = DML区域百分比命令 | DML按档位标记命令 | DML特殊标记命令

export interface DML规则命令基础 {
  /**
   * 命令唯一 id，用于编辑、追踪和排序。
   */
  id: string
  /**
   * 可选备注，便于人工识别该条规则的业务意图。
   */
  备注?: string
}

export interface DML区域百分比命令 extends DML规则命令基础 {
  type: "区域百分比"
  /**
   * 编译时按顺序循环使用。
   */
  规律: string
  /**
   * 按数组顺序依次取区域片段并套用规律。
   */
  区域百分比: DML区域百分比片段[]
  /**
   * 以标记为主：用户手动圈选的线条 ID 列表（主要依据）。
   */
  lineNodeIds: string[]
}

export interface DML区域百分比片段 {
  区域: string
  /**
   * 0~1 小数，占区域内位置比例。
   */
  开始位置: number
  /**
   * 0~1 小数，占区域内位置比例。
   */
  结束位置: number
}

export interface DML按档位标记命令 extends DML规则命令基础 {
  type: "按档位标记"
  /**
   * 编译时按顺序循环使用。
   */
  规律: string
  /**
   * 按数组顺序依次取档位片段并套用规律。
   */
  档位: DML档位片段[]
  /**
   * 以标记为主：用户手动圈选的线条 ID 列表（主要依据）。
   */
  lineNodeIds: string[]
}

export interface DML档位片段 {
  档位名称: string
  /**
   * 0~1 小数，占档位内线条顺序比例。
   */
  开始位置: number
  /**
   * 0~1 小数，占档位内线条顺序比例。
   */
  结束位置: number
}

export interface DML特殊标记命令 extends DML规则命令基础 {
  type: "特殊标记"
  /**
   * 人工精修用的最终覆盖项。
   * 每个 nodeId 直接指定最终 DML 值，不再参与规律循环。
   */
  规律: string
  lineNodeIds: string[]
}

export interface DML规则 {
  /**
   * 命令按顺序执行，后面的覆盖前面的。
   */
  命令列表: DML规则命令[]
}

export const 空DML规则 = (): DML规则 => ({
  命令列表: [],
})
