const postModel = require("../models/post.model")
const postService = require("../server/post.service")

class PostController {
    async getAll(req,res){
        try {
            const allPosts = await postService.getAll()
            res.status(200).json(allPosts)
        } catch (error) {
            res.status(500).json(error)
        }
    }

    async create(req,res){
        try {
         console.log('Request body:', req.body);
         console.log('Request files:', req.files);
         console.log('Files keys:', req.files ? Object.keys(req.files) : 'No files');
         
         let postData = {...req.body};
         
         // Agar rasm yuklangan bo'lsa
         if (req.files && req.files.image) {
             const post = await postService.createWithImage(req.body, req.files.image)
             res.status(201).json(post)
         } else {
             // Rasm yuklanmagan bo'lsa, oddiy post yaratish
             const post = await postService.create(req.body, null)
             res.status(201).json(post)
         }
         } catch (error) {
           console.error("Error creating post:", error)
           res.status(500).json({ error: error.message })
        }
    }

    async delete(req, res){
        try{
          const post = await postService.delete(req.params.id)
          res.status(200).json(post)
        }catch(error){
            res.status(500).json(error)
        }
    }

    async edit(req, res){
        try{
            const {body, params} = req
            
            const post = await postService.updateWithImage(params.id, body, req.files?.image)
            res.status(200).json(post)
        }catch(error){
            console.log(error);
            res.status(500).json({ error: error.message })
        }
    }

    async getOne(req, res){
        try {
           const post = await postService.getOne(req.params.id)
           res.status(200).json(post)
        } catch (error) {
            res.status(500).json(error)
        }
    }

}

module.exports = new PostController()