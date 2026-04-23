import { Db胶丝比例 } from "./Db胶丝比例";
import { 高针图 } from "../models/高针图";
import { 手织图 } from "../models/手织图";
import type { ObjectId } from "mongodb";
export enum 假发类型 {
  间色 = "间色",
  纯色 = "纯色",
  上下分 = "上下分",
  /* T色：只有D尺数，D重量一定存在，可能存在M重量，可能存在L重量。
  - 存在D+M时，重量比值固定为 D:M = 4:6
  - 存在D+M+L时，重量比值固定为 D:M:L = 3:3:4
  - 存在D+L（无M）时，重量比值固定为 D:L = 4:6
  - 多个裁断项时，只有一个裁断项有重量，由人工选择。
  - DML比值字段用于存储启用的权重键，值即比值（如 {D:4,M:6} 或 {D:3,M:3,L:4}）。
   */
  T色 = "T色",
}

export interface 沐茵丝假发成品稿 {
  //样品编号
  _id: ObjectId;
  样品编号: string;
  // 样品编号: string // 例如: "XM-6190(L)"
  假发类型: 假发类型;
  /* 如果是间色假发，则需要填写 DML 比例 */

  客户编号: string; // 例如: "XM"
  品名: string; // 例如: "Michelle BB TBOB080"
  原材料: string; // 例如: "FU:50%+HL:50%"
  /* 即位制帽编号,P-025 */
  CAP: string; // 例如: "P-025(侧分雪花网L)"
  染色档位列表: 染色档位[];
  制品规格书: 制品规格书;
  高针指示单: 高针指示单;
  手织指示单: 手织指示单;
  头型图片: string[];
}

export type 沐茵丝假发成品稿提交 = Omit<沐茵丝假发成品稿, "_id">;

export interface 手织指示单 {
  手织图: 手织图;
  注意事项: string; // 例如: "手织 :1.手织后帽子不能变形。"
}

/*
  长度和重量对应 
  长度使用分数，重量使用小数
  作业方法：本规格书为“TT6/616#”作业；
 */
export interface DML重量 {
  D: number; // D 一定存在
  M?: number;
  L?: number; // 可能存在 L 重量
}

export interface 裁断重量项 {
  裁断: number; // 裁断以数字表示（分数已在外部转为 number）
  重量g?: DML重量; // 每次裁断对应的一组重量（D 必须存在）
}

export interface 制品规格书 {
  // 作业规格清单：包含页面顶部固定字段与多行明细（每行结构参考 11.ts 的 TechRow）
  机器规格清单: {
    档位: string; // 例如 1、2、3、4
    // DML比值仅在间色和T色假发存在（T色用于存储启用的重量键及固定比值）
    DML比值?: {
      D: number;
      M?: number;
      L?: number;
    };
    // 将每一次裁断与其对应重量绑定为一条记录，保证一一对应
    裁断与重量: 裁断重量项[];
    // 整毛固定为两列（元组），例如 [整毛列1, 整毛列2]
    // todo，确认两列整毛概念，改为对象
    整毛: {
      拉尖: number;
      对裁?: number;
    };
    双针: {
      毛长: number;
      尺数: {
        D: number;
        M?: number;
        L?: number;
      };
      密度: number;
    };
    形态?: string;
    美容: {
      铝管: number;
      方向: string;
      层数: number;
    };
    备注?: string;
  }[];
  人工规格清单: {
    档位: string; // 例如 H1、H2、H3
    整毛: {
      拉尖: number;
      对裁?: number;
    };
    // 将每一次裁断与其对应重量绑定为一条记录，保证一一对应
    裁断与重量: 裁断重量项[];
    双针: {
      毛长: number;
      /* 单位:g,展示为‘按15g/扎’ */
      磅发?: number;
      密度?: number;
    };
    形态?: string;
    美容: {
      铝管: number;
    };
    备注?: string;
    位置?: string;
  }[];
  胶丝比例id: Db胶丝比例["_id"];
  // 有颜色编号就不需要额外存储胶丝比例了，可以通过颜色编号关联到胶丝比例表查询
  // 胶丝比例: Db胶丝比例[]; // 颜色编号与胶丝比例表一一对应
  // 制帽规格：帽围/帽深/前后长度以 CM 为单位，制帽编号通过 CAP 关联得到
  制帽: {
    /** 帽围，帽深，前后：单位 cm，通过制帽id获取得到 */
    // 帽围: number // 例如: 58.0（单位 CM）
    // 帽深: number // 例如: 36.0（单位 CM）
    // 前后: number // 例如: 37.0（单位 CM）
    唛头: string; // 例如: "2个标"
  };
  工艺说明: {
    作业方法: string; // 例如: "本规格书为\"TT4/102023#\"作业"，如果是间色假发，例如: "本规格书为\"TT4/102023#\，按D：L=1":3"排发"
    整毛: string; // 例如: "按MIX比例各整毛计量。"
    双针: string; // 例如: "排3MM机,长毛长要准确,密度要均"
    美容: string; // 例如: "98°C*70分。尾部烫一个曲度"
    制帽: string; // 例如: "P-006(雪花网L有尾)"
    手织: string; // 例如: "按图作业."
    高针: string; // 例如: "按图作业."
    完成: string; // 例如: "拆剪干净,处理手感,头顶整个刷毛擦蓬松"
    包装: string; // 例如: "耳朵对耳朵包装,拷贝纸垫1大张注意折饱满..."
    [key: string]: string; // 其他工艺说明项，key为工艺名称，value为说明内容
  };
  // 工程各工序的重量：每项统一为 { 损耗, 数值 } 结构
  //双针重量+制帽重量+手织重量-剪驳重量=完成重量（误差±2g）
  工程重量: {
    // 完成重量通过计算得出，注意：（展示）手织的值=制帽.加减+手织.加减
    整毛?: { 加减: number };
    双针?: { 加减: number };
    美容?: { 加减: number };
    制帽?: { 加减: number };
    手织?: { 加减: number };
    高针?: { 加减: number };
    剪驳?: { 加减: number };
    发网?: { 加减: number };
    完成?: { 加减: number };

    // 完成和重量通过计算得到
    // 完成: { 损耗?: number; 数值?: number }
    // 重量: string; // TODO:需要 190±2g 	190+2g
  };
}

export interface 高针指示单 {
  注意事项: string; // 例如: "高针 :1.高针后帽子不能变形。"
  高针图: 高针图;
}

export type 染色档位 =
  | {
      type: "普通";
      染色图: {
        svg: string; // SVG 字符串，带数据的完整图
        档位标注: {
          档位列表: string[];
          textNodeId: string;
        };
        染色尺寸标注: {
          尺寸: number;
          textNodeId: string;
        };
        文本替换: {
          [key: string]: {
            textNodeId: string;
            fontStyle?: {};
          };
        };
      };
    }
  | {
      type: "对折";
      染色图: {
        svg: string; // SVG 字符串，带数据的完整图
        档位标注: {
          档位列表: string[];
          textNodeId: string;
        };
        染色尺寸标注: {
          尺寸: number;
          textNodeId: string;
        };
        文本替换: {
          [key: string]: {
            textNodeId: string;
            fontStyle?: {};
          };
        };
      };
    }
  | {
      type: "错位";
      染色图: {
        svg: string; // SVG 字符串，带数据的完整图
        档位标注: {
          档位列表: string[];
          textNodeId: string;
        };
        染色尺寸标注: {
          尺寸: number;
          textNodeId: string;
        };
        长尺寸标注: {
          尺寸: number;
          textNodeId: string;
        };
        短尺寸标注?: {
          尺寸: number;
          textNodeId: string;
        };
        文本替换: {
          [key: string]: {
            textNodeId: string;
            fontStyle?: {};
          };
        };
      };
    };
