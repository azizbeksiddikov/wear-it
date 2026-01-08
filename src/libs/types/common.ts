import { Types } from "mongoose";

export interface T {
  [key: string]: any;
}

export interface StatisticModifierRelative {
  _id: Types.ObjectId;
  targetKey: string;
  modifier: number;
}

export interface StatisticModifierAbsolute {
  _id: Types.ObjectId;
  targetKey: string;
  newValue: number;
}
