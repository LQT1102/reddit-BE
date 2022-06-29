import { Context } from "./../types/Context";
import { Upvote } from "./../entities/Upvote";
import { VoteType } from "./../types/VoteType";
import { Arg, Ctx, FieldResolver, ID, Int, Mutation, Query, registerEnumType, Resolver, Root, UseMiddleware } from "type-graphql";
import { FindManyOptions, LessThan } from "typeorm";
import { Post } from "./../entities/Post";
import { User } from "./../entities/User";
import { checkAuth } from "./../middlewares/checkAuth";
import { CreatePostInput } from "./../types/CreatePostInput";
import { PaginatedPosts } from "./../types/PaginatedPosts";
import { PostMutationResponse } from "./../types/PostMutationResponse";
import { UpdatePostInput } from "./../types/UpdatePostInput";
import { UserInputError } from "apollo-server-core";

registerEnumType(VoteType,{
    name: 'VoteType'
})
@Resolver(_of => Post)
export class PostResolver{
    @FieldResolver(_return => String)
    textSnippet(@Root() root: Post){
        return root.text.slice(0, 50) + (root.text.length > 50 ? "..." : "")
    }

    @FieldResolver(_return => User)
    async user(@Root() root: Post){
        return await User.findOne({where: {id: root.userId}});
    }

    @FieldResolver(_return => VoteType, {nullable: true})
    async votedType(
        @Root() root: Post, 
        @Ctx() {req}: Context
    ){
        const {userId} = req.session
        if(!userId){
            return null;
        }
        
        const existingVote = await Upvote.findOne({
            where: {
                postId: root.id,
                userId
            }
        });

        return existingVote?.value || null;
    }

    @UseMiddleware(checkAuth)
    @Mutation(_return => PostMutationResponse)
    async createPost(
        @Arg('createPostInput') {text, title} : CreatePostInput,
        @Ctx() {req} : Context
        ) : Promise<PostMutationResponse>{
        try {
            const newPost = Post.create({
                text,
                title,
                userId: req.session.userId
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

    @Query(_return => PaginatedPosts, {nullable: true})
    async posts(
        @Arg('limit', _type => Int) limit: number, 
        @Arg('cursor', {nullable: true}) cursor?: string
        ): Promise<PaginatedPosts | null>{
        try {
            const realLimit = Math.min(50, limit);
            const findOptions: FindManyOptions<Post> = {
                order: {
                    createdAt: 'DESC'
                },
                take: realLimit,
            }

            let lastPost: Post | null = null;

            if(cursor){
                findOptions.where = {
                    createdAt: LessThan<Date>(new Date(cursor))
                }
                lastPost = (await Post.find({order: {createdAt: 'ASC'}, take: 1}))[0];
            }
            const totalCountPormise = Post.count();
            const postsPromise = Post.find(findOptions);
            const [totalCount, posts] = await Promise.all([totalCountPormise, postsPromise]);

            return {
                cursor: posts[posts.length - 1]?.createdAt || cursor || new Date(),
                hasMore: cursor && lastPost && posts.length ? posts[posts.length - 1].createdAt.toString() !== lastPost?.createdAt.toString() : posts.length !== totalCount,
                paginatedPosts: posts,
                totalCount
            };
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
    async updatePost(
        @Arg('updatePostInput') updatePostInput : UpdatePostInput,
        @Ctx() {req} : Context
        ): Promise<PostMutationResponse>{
        try {
            const {id, text, title} = updatePostInput;
            const existingPost = await Post.findOne({where: {id}});
            if(!existingPost) return {
                code: 400,
                success: false,
                message: "Post not found."
            }

            if(existingPost.userId !== req.session.userId){
                return {
                    code: 401,
                    success: false,
                    message: 'Unauthorised'
                }
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

    @UseMiddleware(checkAuth)
    @Mutation(_return => PostMutationResponse)
    async vote(
        @Arg('postId', _type => Int) postId: number,
        @Arg('voteType', _type => VoteType) voteType : VoteType,
        @Ctx() {req, dataSource} : Context
    ): Promise<PostMutationResponse>{
        try {
            const {userId} = req.session
            return await dataSource.transaction(async (transactionEntityManager) => {
                let post = await transactionEntityManager.findOne(Post, {
                    where: {
                        id: postId
                    }
                })

                if(!post){
                    throw new UserInputError('Post not found')
                }

                //Check if user has voted or not
                const existingVote = await transactionEntityManager.findOne(Upvote, {
                    where: {
                        postId,
                        userId
                    }
                });

                if(existingVote && existingVote.value !== voteType){
                    await transactionEntityManager.save(Upvote, {
                        ...existingVote,
                        value: voteType
                    })

                    post = await transactionEntityManager.save(Post, {
                        ...post,
                        points: post.points + voteType * 2
                    })
                }

                if(!existingVote){
                    const newVote = transactionEntityManager.create(Upvote, {
                        userId,
                        postId,
                        value: voteType
                    })
    
                    transactionEntityManager.save(newVote)
    
    
                    post.points =  post.points + voteType;
    
                    post = await transactionEntityManager.save(post);
                }

                return {
                    code: 200,
                    success: true,
                    post: post,
                    message: "Successfully"
                }
            })
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