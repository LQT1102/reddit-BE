import { Field, ObjectType } from "type-graphql";
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseWithoutId } from "./Base";
import { Post } from "./Post";
import { User } from "./User";

@Entity()
@ObjectType()
export class Upvote extends BaseWithoutId{
    @Column()
    @Field()
    @PrimaryColumn()
    postId!: number;

    @Column()
    @Field()
    @PrimaryColumn()
    userId!: number;

    @Column()
    @Field()
    value!: number;

    @ManyToOne(() => Post, post => post.upvotes)
    post: Post

    @ManyToOne(() => User, user => user.upvotes)
    user: User
}