import { prop, } from "@typegoose/typegoose";
import mongoose from "mongoose";

export abstract class BaseModel {
    _id!: mongoose.Types.ObjectId

    @prop({default: Date.now})
    createdAt: Date
}