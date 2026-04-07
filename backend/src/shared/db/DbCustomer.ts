import { ObjectId } from "mongodb"

export interface DbCustomer {
  _id: ObjectId
  code: string
}
