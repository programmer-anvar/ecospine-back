require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload')
// const postRoute = require('./router/post.route')

const app = express();
app.use(express.json())
app.use(fileUpload({}))

//Routes
app.use('/api/post',require('./router/post.route'))



app.get('/', async (req,res) =>{
    try {
        const allPosts = await postModel.find()
        res.status(200).json(allPosts)
    } catch (error) {
        res.status(500).json(error)
    }
})



app.delete("/:id", (req,res) =>{
    const {id} = req.params
    res.send(id)
})
const PORT = process.env.PORT || 8080

app.put('/:id', (req,res) =>{
    const {id} = req.params
    const body = req.body
    res.json({id, body})
})

const bootsrap = async () =>{
    try{
        await mongoose.connect(process.env.DB_URL).then(() => console.log("Connected DB"))
        app.listen(PORT, () => console.log(`Listening on - http://localhost:${PORT}`))
    }catch(error){
        console.log(`Error conncting with DB:${error}`); 
    }
}

bootsrap()
