/**
 * 数字转 整数部分 + 分数部分
 * 分数只支持：1/4、1/2、3/4
 * 自动取最近的近似值
 */
export type 分数字符 = "¼" | "½" | "¾" | "";

const 分数列表 = [
  { 值: 0.25, 符号: "¼" as const },
  { 值: 0.5, 符号: "½" as const },
  { 值: 0.75, 符号: "¾" as const },
];

export function 数字转分数(数字: number): {
  整数: number;
  分数: 分数字符;
} {
  // 1. 拆出整数和小数
  const 整数部分 = Math.trunc(数字);
  const 小数部分 = 数字 - 整数部分;

  // 2. 找到最接近的分数
  let 最近分数 = 分数列表[0];
  let 最小差 = Math.abs(小数部分 - 最近分数.值);

  for (const 分数 of 分数列表) {
    const 差 = Math.abs(小数部分 - 分数.值);
    if (差 < 最小差) {
      最小差 = 差;
      最近分数 = 分数;
    }
  }

  // 3. 如果小数接近 0 → 分数为空（比如 2.0 → 整数2，分数空）
  if (最小差 > 0.125) {
    return {
      整数: Math.trunc(数字),
      分数: "",
    };
  }

  return {
    整数: 整数部分,
    分数: 最近分数.符号,
  };
}

export function 分数转数字(分数: 分数字符): number {
  if (分数 === "¼") return 0.25;
  if (分数 === "½") return 0.5;
  if (分数 === "¾") return 0.75;
  return 0;
}

export function 整数加分数组合值(整数: number, 分数: 分数字符): number {
  return Math.trunc(整数) + 分数转数字(分数);
}

export function 数字转分数字符串(数字: number): string {
  const { 整数, 分数 } = 数字转分数(数字);
  return 分数 ? `${整数}${分数}` : `${整数}`;
}
