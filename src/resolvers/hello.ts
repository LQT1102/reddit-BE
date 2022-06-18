import { Context } from "./../types/Context";
import { Query, Resolver, Ctx } from "type-graphql";

@Resolver()
export class HelloResolvers{
    @Query(_return => String)
    sayHello(@Ctx() {req}: Context){
        return "Hello " + req.session.userId
    }
}