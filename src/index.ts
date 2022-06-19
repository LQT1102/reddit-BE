
require("dotenv").config();
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from "apollo-server-express";
import MongoStore from "connect-mongo";
import { reverse } from "dns";
import express from 'express';
import session from "express-session";
import mongoose from "mongoose";
import 'reflect-metadata';
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./commons/constants";
import AppDataSource from "./dataSource";
import resolvers from "./resolvers/appResolvers";
import { Context } from "./types/Context";
import cors from 'cors';


const main = async() => {
    //Data source
    await AppDataSource.initialize();

    const app = express();

    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV_PROD}:${process.env.SESSION_DB_PASSWORD_DEV_PROD}@reddit.kzjzy.mongodb.net/reddit`

    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true, //Receive cookies from client
    }))

    //Session/cookies
    await mongoose.connect(mongoUrl, {})

    console.log("Mongo connected.")

    app.use(session({
        name: COOKIE_NAME,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true, //Prevent js frontend read cookie
            secure: __prod__,
            sameSite: 'lax', //csrf
        },
        store: MongoStore.create({mongoUrl}),
        secret: process.env.SESSION_SECRET_DEV_PROD as string,
        saveUninitialized: false, //Dont set empty sessions,
        resave: false,
    }))

    const appolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: resolvers,
            validate: false
        }),
        context: ({ req, res }): Context => ({
			req,
			res,
		}), //Get context pass from express
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()]
    })

    await appolloServer.start();

    appolloServer.applyMiddleware({
        app,
        cors: false
    });

    app.listen(4000, () => {
        console.log("Server started on port 4000!!!")
    })
}

main().catch(err => console.log(err))

