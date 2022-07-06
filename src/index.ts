import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from "apollo-server-express";
import MongoStore from "connect-mongo";
import cors from 'cors';
import express from 'express';
import session from "express-session";
import mongoose from "mongoose";
import 'reflect-metadata';
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./commons/constants";
import AppDataSource from "./dataSource";
import resolvers from "./resolvers/appResolvers";
import { Context } from "./types/Context";
import { buildDataLoaders } from "./utils/dataLoader";

require("dotenv").config();


const main = async() => {
    //Data source
    const dataSource = await AppDataSource.initialize();
    dataSource.transaction

    if(__prod__) await dataSource.runMigrations()

    const app = express();

    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV_PROD}:${process.env.SESSION_DB_PASSWORD_DEV_PROD}@reddit.kzjzy.mongodb.net/reddit`

    app.use(cors({
        origin: __prod__ ? process.env.CORS_ORIGIN_PROD :'http://localhost:3000',
        credentials: true, //Receive cookies from client
    }))

    //Session/cookies
    await mongoose.connect(mongoUrl, {})

    console.log("Mongo connected.")

    app.set('trust proxy', 1)

    app.use(session({
        name: COOKIE_NAME,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true, //Prevent js frontend read cookie
            secure: __prod__, //Coookie only works in https
            sameSite: 'none', //csrf - lax
            // domain: __prod__ ? process.env.CORS_ORIGIN_PROD : undefined
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
        context: ({ req, res}): Context => ({
			req,
			res,
            dataSource,
            dataLoaders: buildDataLoaders() //init data loader
		}), //Get context pass from express
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()]
    })

    await appolloServer.start();

    appolloServer.applyMiddleware({
        app,
        cors: false
    });

    const PORT = process.env.PORT || 4000 //process.env.PORT - default env of heroku

    app.listen(PORT || 4000, () => {
        console.log(`Server started on port ${PORT}!!!`)
    })
}

main().catch(err => console.log(err))

