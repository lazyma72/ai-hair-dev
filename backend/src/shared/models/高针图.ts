import { 钩织深浅 } from "./钩织深浅"

export interface 高针图 {
  底图: {
    svg: string // SVG 原图字符串，不带标记，挡位,单双的底图数据
    区域名: string[]
    // 每根线一个记录
    区域线条: {
      区域名: string
      lineNodeIds: string[]
      lineLength: number
    }[]
    区域DML标注: {
      区域名: string
      textNodeIds: string[]
    }[]
    文本替换: {
      [key: string]: {
        textNodeId: string
        fontStyle?: {}
      }
    }
  }
  // 所有自定义数据交互逻辑按照 区域+百分比 方式配置
  自定义数据: {
    DML标注: {
      标注序列: string[] // 例如: ["D", "D", "L"]
      // 标注方式：把标注区域转成 textNodeIds[]
      标注区域: {
        区域名: string // 例如: "尾巴"
        起点位置: number // 例如: 0.2（百分比表示）
        终点位置: number // 例如: 0.5（百分比表示）
      }[]
    }[]
    文本替换: {
      [key: string]: {
        text: string
        // 如果不配置就用默认样式
        fontStyle?: {}
      }
    }
  }
}

export type 系统预置区域名 = "尾巴" | "松颈" | "耳朵" | "竖车" | "横车"

export interface 区域配置 {
  lineLength: number
}

// 思路一：基于已有的图来改
// 1. 已有的图：SVG 底图
// 2. 来改（改哪，怎么改）：配置哪些元素能改，怎么改（有些换字、有些改色、有些控制显隐……）
// 好处：对图改动最小，图不用动，只需要标注
// 坏处：如果图不规范，生成出来也不规范；只能做有限改动

// 思路二：从零生成图
// 1. 空底图
// 2. 人工设置区域标注比例，例如 尾巴：[0%, 20%]，松紧：[50%, 100%]，……
// 3. 需要知道每根线是谁，每根线的 DML、档位、正反等标注方式
// 新的方式：
// 3.1 修改图：删除所有DML标注
// 3.2 标注所有线条
// 3.3 程序生成DML标注的位置和样式

// 高针图
// 底图
// DML 标注信息：{标注: string[], 区域: {区域名，开始位置，结束位置}[]}[]
// 画出来：改旧图（删除DDL标记），写新字
// —— 写什么？计算出来的，知道
// —— 字体颜色大小样式：统一配置
// —— 写在哪？位置：标记所有线条（路径，起点，终点，区域所属，index），自动计算位置，可以统一配置一个相对位置
// DDL 标注位置（百分比或距离终点距离）
// type DDL标注绝对位置 = {type: 'percentage'; value: number} | {type: 'distanceFromEnd'; value: number};
// type DDL标注位置 = DDL标注绝对位 | (区域名, index, 标注char)=>DDL标注绝对位置

// type 可定制区域 = {
//   名称;
//   lines: {
//     标注位置: { x: number; y: number };
//   }[];
// };

/* 估时
1 标注工具
2 流程页面
3 excel录入

*/
