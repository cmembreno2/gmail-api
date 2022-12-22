const express = require('express');
require('dotenv').config();

const router = express.Router();

router.get('/threads/:id', async (req,res)=>{

    console.log("Executing Get Thread by Id route...")

    const id = req.params.id;

    try{
        const results=[{to:"cmembreno",from:"cvega",date:"Today",message:"Hello World"}];
        console.log("Get Thread by Id executed successfully...")
        return res.status(200).json(results);
    }catch(err){
        console.log(`Error executing Get Product by Id: ${err}`);
        return res.status(err.code).send(err.message);
    }
});

module.exports = router;