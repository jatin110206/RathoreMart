const mongoose=require('mongoose');
const userShema=new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type:String,
        required: true,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    verified:{
        type:Boolean,
        default:false
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    }

});


module.exports =mongoose.model("User",userShema);