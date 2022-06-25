import { Field, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, UpdateDateColumn } from 'typeorm';
import { Base } from "./Base";
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