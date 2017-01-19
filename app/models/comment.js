var mongoose = require("mongoose");
// var dateFormat = require('dateformat');
// var now = new Date();
// dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT");
var commentSchema = mongoose.Schema({
    text: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username: String
    },
    date: {
        type: Date,
        default: Date(),
        timestamps: { createdAt: 'created_at' }
    }
});



module.exports = mongoose.model("Comment", commentSchema);