import { Field, ObjectType } from "type-graphql"
import { Column, Entity } from 'typeorm'
import { Base } from "./Base"

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
}