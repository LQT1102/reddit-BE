import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { DataSource } from "typeorm";

const AppDataSource =  new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: "reddit",
    synchronize: true,
    logging: true,
    entities: [User, Post],
    subscribers: [],
    migrations: [],
})

export default AppDataSource;