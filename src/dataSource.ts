import { __prod__ } from "./commons/constants";
import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { Upvote } from "./entities/Upvote";
import { User } from "./entities/User";
import path from "path";
require("dotenv").config();

const AppDataSource =  new DataSource({
    type: "postgres",
    ...(__prod__ 
        ? {url: process.env.DATABASE_URL} 
        : {
        host: process.env.DB_HOST_DEV,
        port: 5432,
        username: process.env.DB_USER_DEV,
        password: process.env.DB_PASSWORD_DEV,
        database: process.env.DB_DATABASE_NAME_DEV,
    }), 
    ...(__prod__ ? {} : {synchronize: true}),
    ...(__prod__ ? {extra: {ssl: { rejectUnauthorized: false}}} : {}),
    logging: true,
    entities: [User, Post, Upvote],
    migrations: [path.join(__dirname, './migrations/*')],
    subscribers: ["src/subscribers/**/*{.js,.ts}"],
})

export default AppDataSource;