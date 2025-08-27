const postModel = require("../models/post.model")
const fileService = require("./file.service")

class PostService {
    async create(post, image){
        let postData = {...post};
        
        if (image) {
            const fileName = fileService.save(image)
            postData.image = fileName;
        }
        
        const newPost = await postModel.create(postData)
        return newPost
    }

    async getAll(){
        const allPosts = await postModel.find()
        return allPosts
    }

    async delete(id){
        const post = await postModel.findByIdAndDelete(id)
        return post
    }

    async edit(post, id){
        if(!id){
            throw new Error("Id not found")
        }
        const updatedData = await postModel.findByIdAndUpdate(id, post, {new:true})
        return updatedData
    }

    async getOne(id){
        const post = await postModel.findById(id)
        return post
    }

    async createWithImage(post, image){
        if (!image) {
            throw new Error("Image is required")
        }
        const fileName = fileService.save(image)
        const newPost = await postModel.create({...post, image: fileName})
        return newPost
    }

    async updateWithImage(id, post, image){
        if(!id){
            throw new Error("Id not found")
        }
        
        let updateData = {...post}
        
        if (image) {
            const fileName = fileService.save(image)
            updateData.image = fileName
        }
        
        const updatedData = await postModel.findByIdAndUpdate(id, updateData, {new:true})
        return updatedData
    }
}

module.exports = new PostService()