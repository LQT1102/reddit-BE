import { Field, ID, ObjectType  } from "type-graphql"
import { BaseEntity, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@ObjectType()
@Entity() //Declare db table
export abstract class Base extends BaseEntity{
    @Field(_type => ID)
    @PrimaryGeneratedColumn()
    id!: number

    @Field()
    @CreateDateColumn({type: "timestamptz"})
    createdAt!: Date

    @Field()
    @UpdateDateColumn({type: "timestamptz"})
    updatedAt!: Date
}