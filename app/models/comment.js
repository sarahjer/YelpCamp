var mongoose = require("mongoose");

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
        default: Date.now(),
        timestamps: { createdAt: 'created_at' }
    }
});



module.exports = mongoose.model("Comment", commentSchema);