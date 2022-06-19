import { Context } from "./../types/Context";
import { COOKIE_NAME } from "./../commons/constants";
import { LoginInput } from "./../types/LoginInput";
import { validateRegisterInput } from "./../utils/validateRegisterInput";
import { RegisterInput } from "./../types/RegisterInput";
import { UserMutationResponse } from "./../types/UserMutationResponse";
import { User } from "./../entities/User";
import { Arg, Mutation, Resolver, Ctx, Query } from "type-graphql";
import argon2 from 'argon2'

@Resolver()
export class UserResolver{
    @Query(_return => User, {nullable: true})
    async me(@Ctx() {req, res}: Context) : Promise<User | undefined | null>{
        if(!req.session.userId) return null;
        const user = User.findOne({where: {id: req.session.userId}});
        return user;
    }

    @Mutation(_return => UserMutationResponse)
    async register(
        @Arg('registerInput') registerInput: RegisterInput,
        @Ctx() {req, res}: Context
    ): Promise<UserMutationResponse> {
       try {
        const validateRegisterInputErrors = validateRegisterInput(registerInput)
        if(validateRegisterInputErrors !== null){
            return {
                code: 400,
                success: false,
                ...validateRegisterInputErrors
            } 
        }

        const {email, password, username} = registerInput;

        const existingUser = await User.findOne({where: [{username}, {email}]});
        
        if(existingUser) {
            const fieldName = existingUser.username === username ? "username" : "email"
            return {
                code: 400,
                success: false,
                message: `Duplicated ${fieldName}.`,
                errors: [{
                    field: fieldName,
                    message: `${fieldName} already taken.`
                }]
            }
        }


        const hashedPassword = await argon2.hash(password);

        const newUser = User.create({
            username,
            password: hashedPassword,
            email
        });

        const createdUser = await User.save(newUser);

        req.session.userId = createdUser.id;

        return {
            code: 200,
            success: true,
            message: "User registration successful.",
            user: createdUser
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

    @Mutation(_return => UserMutationResponse)
    async login(
        @Ctx() { req }:Context,
        @Arg("loginInput") loginInput: LoginInput
    ): Promise<UserMutationResponse>{
        const {password, usernameOrEmail} = loginInput;
        const existingUser = await User.findOne({where: usernameOrEmail.includes("@") ? {email: usernameOrEmail} : {username: usernameOrEmail}})

        if(!existingUser) return {
            code: 400,
            success: false,
            message: "User not found.",
            errors: [{field: 'usernameOrEmail', message: 'Username or email incorrect.'}]
        }

        const passwordValid = await argon2.verify(existingUser.password, password);

        if(!passwordValid) return {
            code: 400,
            success: false,
            message: "Wrong password.",
            errors: [{field: 'password', message: 'Wrong password.'}],
        }

        //Create session and return cookie
        req.session.userId = existingUser.id
        console.log(req.session)
        return {
            code: 200,
            success: true,
            message: "Logged in successfully.",
            user: existingUser
        }
    }

    @Mutation(_return => Boolean)
    logout(@Ctx() {req, res} : Context): Promise<Boolean>{
        return new Promise((resolve, _reject) => {
            res.clearCookie(COOKIE_NAME)
            req.session.destroy(err => {
                if(err) resolve(false);
            })
            resolve(true)
        })
    }
}