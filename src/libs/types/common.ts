import { ObjectId } from "mongoose";

export interface T {
  [key: string]: any;
}

export interface StatisticModifierRelative {
  _id: ObjectId;
  targetKey: string;
  modifier: number;
}

export interface StatisticModifierAbsolute {
  _id: ObjectId;
  targetKey: string;
  newValue: number;
}
