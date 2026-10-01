import mongoose from 'mongoose';

const machineschema =new mongoose.Schema({
    reference :{
        type : String,
        required : true,
        unique : true
    },
    nom: {
        type : String,
        required : true,
        trim: true
    },
    workshop : {
        type: String,
        required : true,
        trim: true
    },
    status :{
        type: String,
        enum: {
            values:['disponible', 'en maintenance', 'hors service']
        },
        default:'disponible',
    },
},
{timestamps: true});

const Machine = mongoose.model('machine',machineschema);
export default Machine;