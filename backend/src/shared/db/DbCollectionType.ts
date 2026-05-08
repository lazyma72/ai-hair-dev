import { Db胶丝比例 } from "./Db胶丝比例"
import { DbCustomer } from "./DbCustomer"
import { DbUser } from "./DbUser"
import { Db制帽 } from "./Db制帽"
import { Db制帽线色关联表 } from "./Db制帽线色关联表"
import { 沐茵丝假发成品稿 } from "./Db沐茵丝假发成品稿"

export interface DbCollectionType {
  胶丝比例: Db胶丝比例
  客户: DbCustomer
  用户: DbUser
  制帽: Db制帽
  制帽线色关联表: Db制帽线色关联表
  沐茵丝假发成品稿: 沐茵丝假发成品稿
}
