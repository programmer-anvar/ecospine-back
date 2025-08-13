const {Schema,model} = require('mongoose');

const postSchema = new Schema({
    title:{type:String, required: true},
    body:{type:String, required: true},
    // image:{type:String},
    price:{type:String, required: true}
})

module.exports = model("Post", postSchema)

