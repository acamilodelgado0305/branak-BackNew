import mongoose from 'mongoose';

const { Schema } = mongoose;

const Visitor = new Schema({
    name: {type:String },
    roomid:{type:String},
    avatar:{type:String , default: null},
    avatarStatus: {type:Boolean , default: false},
    isUser : {type:Boolean , default: true},
    statusMessage: { type: Boolean, default: true },
    status: { type: Boolean , default: true }
});

export default mongoose.model('Visitor', Visitor);