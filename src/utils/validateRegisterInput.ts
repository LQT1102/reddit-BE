import { RegisterInput } from "./../types/RegisterInput";

export const validateRegisterInput = (registerInput : RegisterInput) => {
    if(!registerInput.email.includes("@")){
        return {
            message: "Invalid email.",
            errors: [
                {field: "email", message: "Email must include @ symbol"}
            ]
        }
    }

    if(registerInput.username.length <= 2){
        return {
            message: "Invalid username.",
            errors: [
                {field: "username", message: "Invalid username."}
            ]
        }
    }

    if(registerInput.username.includes("@")){
        return {
            message: "Invalid username.",
            errors: [
                {field: "username", message: "Username cannot include @."}
            ]
        }
    }

    if(registerInput.password.length <= 2){
        return {
            message: "Invalid username.",
            errors: [
                {field: "password", message: "Invalid password."}
            ]
        }
    }

    return null;
}