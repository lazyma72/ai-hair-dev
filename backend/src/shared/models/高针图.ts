export type DML值 = "D" | "M" | "L";

export interface 标注边框样式 {
  边框形状: "圆形" | "方形";
  边框颜色: string;
  背景颜色: string;
  是否透明: boolean;
}

export interface 高针图 {
  // 纯渲染，编辑器无关，可以自由替换通用 SVG Editor
  // 所有车线标注文本都已经生成到 SVG 上
  svg: string;

  车线: {
    id: string;
    编号: number;
    区域: string;
    车线编号: string;
    尺数: number;
    档位: string;
    DML: DML值;
    是双数: boolean;
    // 设置的方法：划线，在相交处自动创建新文本（删除旧的）
    // 改位置：直接拖 SVG
    标注NodeId: {
      车线编号: string;
      档位: string;
      单双: string;
      DML: string;
    };
  }[];

  标注样式: Partial<{
    车线编号: 标注样式;
    档位: 标注样式;
    单双: 标注样式;
    DML: 标注样式;
  }>;

  自动修改器: 自动修改器配置[];
}

type 自动修改器公共字段 = {
  /** 可选：编辑器侧生成，用于稳定渲染/编辑 */
  id?: string;
  /** 可选：未设置时视为启用 */
  启用?: boolean;
  /**
   * DML 规律，如 ["D","M","L"]。
   * 注意：当前约定按区域/按档位的范围都是 0~1 百分比区间（含端点）。
   */
  规律: string[];
};

export type 自动修改器配置 =
  | (自动修改器公共字段 & {
      type: "按区域自动标注DML";
      范围: {
        区域: string;
        /** 0~1：区域内百分比开始位置 */
        开始: number;
        /** 0~1：区域内百分比结束位置 */
        结束: number;
      }[];
    })
  | (自动修改器公共字段 & {
      type: "按档位自动标注DML";
      范围: {
        档位: string;
        /** 0~1：档位范围（后端会先换算成区域占比再匹配） */
        开始: number;
        /** 0~1：档位范围（后端会先换算成区域占比再匹配） */
        结束: number;
      }[];
    });
export interface 标注样式 {
  字体: string;
  字号: number;
  字色: string;
  有边框?: 标注边框样式;
}

export interface 高针图系统预置区域 {
  name: string;
  lineLength: number;
}

export const 高针图系统预置区域列表: 高针图系统预置区域[] = [
  { name: "尾巴", lineLength: 7 },
  { name: "松颈", lineLength: 13 },
  { name: "耳朵", lineLength: 17 },
  { name: "竖车", lineLength: 7 },
  { name: "横车", lineLength: 6 },
  { name: "鱼眼", lineLength: 2 },
  { name: "鱼眼上-短横车", lineLength: 2 },
  { name: "鱼眼上-横车", lineLength: 6 },
  { name: "鱼眼下-横车", lineLength: 6 },
  { name: "拱形前网", lineLength: 12 },
];
