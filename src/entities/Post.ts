import { Column, Entity } from 'typeorm';
import { Base } from "./Base";
import { Field, ID, ObjectType } from "type-graphql"

@ObjectType()
@Entity() //Declare db table
export class Post extends Base{
   @Column()
   @Field()
   title!: string;

   @Column()
   @Field()
   text!: string;
}