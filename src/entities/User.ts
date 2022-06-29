import { Upvote } from "./Upvote";
import { Field, ObjectType } from "type-graphql"
import { Column, Entity, OneToMany } from 'typeorm'
import { Base } from "./Base"
import { Post } from "./Post"

@ObjectType()
@Entity() //Declare db table
export class User extends Base{
    @Field(_type => String)
    @Column({unique: true})
    username!: string

    @Field(_type => String)
    @Column({unique: true})
    email!: string

    @Column()
    password!: string

    @OneToMany(() => Post, post => post.user)
    posts: Post[]

    @OneToMany(() => Upvote, upvote => upvote.user)
    upvotes: Upvote[]
}