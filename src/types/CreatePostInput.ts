import { InputType, Field } from "type-graphql";

@InputType()
export class CreatePostInput{
    @Field()
    title: string

    @Field()
    text: string;

}