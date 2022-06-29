import { VoteType } from "./../types/VoteType";
import { Upvote } from "./Upvote";
import { Field, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
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

   @OneToMany(() => Upvote, upvote => [upvote.post])
   upvotes: Upvote[]

   @Column({default: 0})
   @Field()
   points!: number

   @Field(() => VoteType, {nullable: true})
   votedType: VoteType | null
}