import { BaseModel } from "./BaseModel";
import { prop, getModelForClass } from "@typegoose/typegoose";
import mongoose from "mongoose";

export class Token extends BaseModel {
    _id!: mongoose.Types.ObjectId

    @prop({required: true})
    userId!: string

    @prop({required: true})
    token!: string

    @prop({default: Date.now, expires: 60*5})
    createdAt: Date
}

export const TokenModel = getModelForClass(Token);