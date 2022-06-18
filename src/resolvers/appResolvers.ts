import { PostResolver } from "./post";
import { NonEmptyArray } from "type-graphql";
import { HelloResolvers } from "./hello";
import { UserResolver } from "./user";

const resolvers : NonEmptyArray<Function> | NonEmptyArray<string> = [
    HelloResolvers, 
    UserResolver,
    PostResolver
];
export default resolvers;