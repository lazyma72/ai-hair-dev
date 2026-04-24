type 发色 = "D" | "M" | "L";

/**
 * 横排中“行”的颜色键：
 * - 纯色/间色：D/M/L
 * - 染色：DT/MT/LT
 */
type 横排行颜色键 = 发色 | "DT" | "MT" | "LT";

type 长度单位 = "CM";

type 长度值 = {
  value: number;
  unit: 长度单位;
};

type 横排行 = {
  /**
   * 顺序可变：
   * - LT色 1.0CM xxx备注
   * - MT色 1.0CM xxx备注
   * - DT色 1.0CM xxx备注
   *
   * 或者非染色时：
   * - L色 1.0CM xxx备注
   * - M色 1.0CM xxx备注
   * - D色 1.0CM xxx备注
   */
  lines: Array<{
    color: 横排行颜色键;
    length: 长度值;
    remark?: string;
  }>;
};

type 类型 =
  | {
      type: "方形";
    }
  | ({
      type: "横排";
    } & 横排行 & {
        remark?: string;
      });

/*
发色：D / M / L
如果染色，对应的为 DT / MT / LT
*/
