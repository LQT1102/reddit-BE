import { ChangePasswordInput } from "./../types/ChangePasswordInput";
import { Token, TokenModel } from "./../models/Token";
import { Context } from "./../types/Context";
import { COOKIE_NAME } from "./../commons/constants";
import { LoginInput } from "./../types/LoginInput";
import { validateRegisterInput } from "./../utils/validateRegisterInput";
import { RegisterInput } from "./../types/RegisterInput";
import { UserMutationResponse } from "./../types/UserMutationResponse";
import { User } from "./../entities/User";
import { Arg, Mutation, Resolver, Ctx, Query } from "type-graphql";
import argon2 from 'argon2'
import { ForgotPasswordInput } from "../types/ForgotPassword";
import sendEmail from "../utils/sendEmail";
import {v4 as uuidv4} from 'uuid';

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
        try {
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
        } catch (error) {
            console.log(error)
            return {
                code: 500,
                success: false,
                message: `Internal server error: ${error.message}`
            };
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

    @Mutation(_return => Boolean)
    async forgotPassword(@Arg('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput): Promise<boolean>{
        try {
            const user = await User.findOne({where: {email: forgotPasswordInput.email}});

            if(!user) return true;

            const resetToken = uuidv4();

            const hashedResetToken = await argon2.hash("password");

            //Save token to db
            await TokenModel.remove({userId : `${user.id}`});

            await new TokenModel(
                {userId : `${user.id}`, token: hashedResetToken}
            ).save();

            //Send reset password link to user via email
            await sendEmail([forgotPasswordInput.email], `<a href="http://localhost:3000/change-password?token=${resetToken}&userId=${user.id}">Click here to reset your password.</a>`)
            
            return true;
        } catch (error) {
            return false;
        }
    }

    @Mutation(_return => UserMutationResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('userId') userId: string,
        @Arg('changePasswordInput') changePasswordInput: ChangePasswordInput,
        @Ctx() {req} : Context
    ): Promise<UserMutationResponse>{
        try {
            if(changePasswordInput.newPassword.length <= 2) return {
                code: 400,
                success: false,
                message: "Invalid password.",
                errors: [{
                    field: "newPassword",
                    message: "Length must be greater than 2"
                }]
            }
            const resetPasswordTokenRecord = await TokenModel.findOne({userId});

            if(!resetPasswordTokenRecord){
                return {
                    code: 400,
                    success: false,
                    message: `Invalid orr exxpired password reset token.`,
                    errors: [{
                        field: "token",
                        message: "Invalid orr exxpired password reset token."
                    }]
                };
            }

            const resetPasswordTokenValid = argon2.verify(resetPasswordTokenRecord.token, token);

            if(!resetPasswordTokenRecord) return {
                code: 400,
                success: false,
                message: `Invalid orr exxpired password reset token.`,
                errors: [{
                    field: "token",
                    message: "Invalid orr exxpired password reset token."
                }]
            };

            const userIdNum = +userId;
            const user = await User.findOne({where: {id: userIdNum}});

            if(!user) return {
                code: 400,
                success: false,
                message: `User no longer exists.`,
                errors: [{
                    field: "token",
                    message: "User no longer exists."
                }]
            };

            const updatedPassword = await argon2.hash(changePasswordInput.newPassword);

            await User.update({id: userIdNum}, {password: updatedPassword});

            await resetPasswordTokenRecord.deleteOne();

            req.session.userId = user.id;

            return {
                code: 200,
                success: true,
                user: user,
                message: "User password reset successfully."
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