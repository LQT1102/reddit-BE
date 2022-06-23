import { Column, Entity, ManyToOne } from 'typeorm';
import { Base } from "./Base";
import { Field, ID, ObjectType } from "type-graphql"
import { User } from "./User";

@ObjectType()
@Entity() //Declare db table
export class Post extends Base{
   @Column()
   @Field()
   title!: string;

   @Column()
   @Field()
   text!: string;

   @Column()
   @Field()
   userId!: number;

   @Field(_type => User)
   @ManyToOne(() => User, user => user.posts)
   user: User
}