import { checkAuth } from "./../middlewares/checkAuth";
import { UpdatePostInput } from "./../types/UpdatePostInput";
import { Post } from "./../entities/Post";
import { PostMutationResponse } from "./../types/PostMutationResponse";
import { CreatePostInput } from "./../types/CreatePostInput";
import { COOKIE_NAME } from "./../commons/constants";
import { LoginInput } from "./../types/LoginInput";
import { validateRegisterInput } from "./../utils/validateRegisterInput";
import { RegisterInput } from "./../types/RegisterInput";
import { UserMutationResponse } from "./../types/UserMutationResponse";
import { User } from "./../entities/User";
import { Arg, Mutation, Resolver, Ctx, Query, ID, UseMiddleware } from "type-graphql";
import argon2 from 'argon2'
import { Context } from "../types/Context";

@Resolver()
export class PostResolver{
    @UseMiddleware(checkAuth)
    @Mutation(_return => PostMutationResponse)
    async createPost(@Arg('createPostInput') {text, title} : CreatePostInput) : Promise<PostMutationResponse>{
        try {
            const newPost = Post.create({
                text,
                title
            })

            await newPost.save();

            return {
                code: 200,
                message: "Post created successfully.",
                success: true,
                post: newPost
            }
        } catch (error) {
            console.log(error)
            return {
                code: 500,
                success: false,
                message: `Internal server error: ${error.message}`
            };
        }
    }

    @Query(_return => [Post], {nullable: true})
    async posts(): Promise<Post[] | null>{
        try {
            return Post.find();
        } catch (error) {
            console.log(error)
            return null;
        }
    }

    @Query(_return => Post, {nullable: true})
    async post(@Arg('id', _type => ID) id: number): Promise<Post | null>{
        try {
            const post = await Post.findOne({where: {id}});
            return post;
        } catch (error) {
            console.log(error)
            return null;
        }
    }

    @UseMiddleware(checkAuth)
    @Mutation(_return => PostMutationResponse)
    async updatePost(@Arg('updatePostInput') updatePostInput : UpdatePostInput): Promise<PostMutationResponse>{
        try {
            const {id, text, title} = updatePostInput;
            const existingPost = await Post.findOne({where: {id}});
            if(!existingPost) return {
                code: 400,
                success: false,
                message: "Post not found."
            }

            existingPost.title = title;
            existingPost.text = text;

            await existingPost.save();

            return {
                code: 200,
                success: true,
                message: "Post updated successfully.",
                post: existingPost
            }
        } catch (error) {
            console.log(error)
            return {
                code: 500,
                success: false,
                message: `Internal server error: ${error.message}`
            };
        }
    }

    @UseMiddleware(checkAuth)
    @Mutation(_return => PostMutationResponse)
    async deletePost(
        @Arg("id", _type=> ID) id : number, 
        @Ctx() {req, res}: Context) : Promise<PostMutationResponse>{
        try {
            const existingPost = await Post.findOne({where: {id}});
            if(!existingPost) return {
                code: 400,
                success: false,
                message: "Post not found."
            }

            await Post.delete({id});

            return {
                code: 200,
                success: true,
                message: "Deleted successfully."
            }
        } catch (error) {
            console.log(error)
            return {
                code: 500,
                success: false,
                message: `Internal server error: ${error.message}`
            };
        }
    }   
}