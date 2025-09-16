import mongoose from "mongoose";
import { TErrorSource } from "../constents";

const mongoseErrorHandeller = (err : mongoose.Error.ValidationError )=>{
    const statusCode=400
    const errorSource:TErrorSource = Object.values(err.errors).map((value : mongoose.Error.ValidatorError | mongoose.Error.CastError)=>
        {
        return{
            path:value?.path,
            message:value?.message
        }
    }
)
    return{
        statusCode,
        message:"validation error",
        errorSource
    }
}

export default mongoseErrorHandeller