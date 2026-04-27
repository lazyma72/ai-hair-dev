import { Collection, Db, MongoClient } from "mongodb"
import {DbCollectionType} from "../shared/db/DbCollectionType"
import { backConfig } from "./backConfig"

export class Global {
  static db: Db
  private static client: MongoClient

  /**初始化数据库 */
  static async init() {
    console.log(`Start connecting db...`)

    this.client = new MongoClient(backConfig.mongoUrl, {
      // minPoolSize: 100,
      maxPoolSize: 200,
    })
    await this.client.connect()

    this.db = this.client.db()
    console.info(`数据库已启动`)
  }

  /**连接数据表 */
  static getCollection<T extends keyof DbCollectionType>(col: T): Collection<DbCollectionType[T]> {
    let prefix = "AiHari_"
    if (backConfig.env !== "prod") {
      prefix += backConfig.env + "_"
    }
    return this.db.collection(prefix+col)
  }

  static async destroy() {
    await this.client?.close()
  }

}
