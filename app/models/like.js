var mongoose = require("mongoose");

var likeSchema = mongoose.Schema({
    authors:[
         {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    campground:
         {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Campground"
        } 
});

module.exports = mongoose.model("Like", likeSchema);