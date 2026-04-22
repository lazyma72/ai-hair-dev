import type { DML规则命令列表 } from "./DML规则"
export interface 高针图 {
  底图: {
    /** SVG 字符串（底图数据，不包含运行时 UI 叠加标记） */
    svg: string
    区域名: string[]
    /** 每根线一个记录 */
    区域线条: {
      区域名: string
      lineNodeIds: string[]
      lineLength: number
      区域内位置占比: number
    }[]
    档位标注: {
      区域名: string
      lineNodeIds: string[]
      textNodeIds: string[]
    }[]

    /** 自定义文本节点（保留/新增需要的 text 节点） */
    文本节点: {
      [key: string]: {
        textNodeId: string
        text?: string
        created?: boolean
        fontStyle?: { [key: string]: unknown }
      }
    }
  }

  自定义数据: {
    /** DML 规则命令列表（扁平结构） */
    DML规则命令列表: DML规则命令列表
    单双标注: {
      lineNodeId: string
      双数: boolean
      textNodeId: string
    }[]
  }
}

export interface 高针图系统预置区域 {
  name: string
  lineLength: number
}

export const 高针图系统预置区域列表: 高针图系统预置区域[] = [
  { name: "尾巴", lineLength: 7 },
  { name: "松颈", lineLength: 13 },
  { name: "耳朵", lineLength: 17 },
  { name: "竖车", lineLength: 7 },
  { name: "横车", lineLength: 6 },
  { name: "鱼眼", lineLength: 2 },
  { name: "鱼眼上-横车", lineLength: 6 },
  { name: "鱼眼下-横车", lineLength: 6 },
  { name: "拱形前网", lineLength: 12 },
]

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
// 3.1 修改图：删除所有旧 DML 文字
// 3.2 标注所有线条
// 3.3 程序根据 DML规则命令列表 生成标记的位置和样式

// 高针图
// 底图
// DML 规则信息：按区域规律、档位规律、特殊规律组合
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
