const express = require('express');
require('dotenv').config();

const router = express.Router();

router.get('/threads', async (req,res)=> {

    console.log("Executing Get Threads...")
    
    const results = [{id:"123456",txt:"Hello world"}];
    
    try{
        
        console.log("Get Threads executed successfully...")
        return res.status(200).json(results);
    }catch(err){
        console.log(`Error executing Get Threads: ${err}`)
        return res.status(err.code).send(err.message);
    }
});

module.exports = router;