import { Db胶丝比例 } from "./Db胶丝比例"
import { Db制帽 } from "./Db制帽"

export interface Db制帽线色关联表 {
  _id: {
    颜色编号: Db胶丝比例["_id"]["颜色编号"]
    发丝种类: Db胶丝比例["_id"]["发丝种类"]
    制帽id: Db制帽["_id"]
  }
  线色: string
  备注?: string
}
