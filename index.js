const express = require('express');
const {createClient} = require('redis');
const Redis = require('redis');
const port = process.env.PORT || 8000;
const axios = require('axios');
const mongoose = require("mongoose");
const DEFAULT_EXPIRATION = 3600;

const baseURL = "https://jsonplaceholder.typicode.com/"

const app = express();
app.use(express.static('public'));
app.use(express.json());

const redidClient = createClient();
redidClient.on('connect', function() {
    console.log('Connected to Redis...');
});

redidClient.on('error', function (err) {
    console.log('Redis error: ' + err);
});

const redisMidelware = async (req, res, next) => {
 
    if (redidClient === null) {
        return next();
    }
    redidClient.exists(req.originalUrl, (err, reply) => {
        if (err) throw err;

        if(reply === 1){
            console.log(req.originalUrl)
            console.log("Fetching from Redis Cache");
            redidClient.get(req.originalUrl, async (err, reply) => {
                if (err) throw err;
                return res.status(200).send(JSON.parse(reply));
            });
        } else {
            // Key does not exist in Redis
            next();
        }
}

    )
}








app.get("/users", redisMidelware,async (req,res) => {
    try {
        const params = req.query;
        console.log(params)
        const collection = mongoose.connection.db.collection("users");
        const users = await collection.find(params).toArray();
        redidClient.set(req.originalUrl,  JSON.stringify(users));
        res.status(200).json(users);
    } catch (error) {
         console.log(error);
         res.status(500).json({error: error.message});
         
    }
}       
);

app.get("/posts" , redisMidelware,async (req,res) => {
    try {
        const params = req.query;
        console.log(params)
        const collection = mongoose.connection.db.collection("posts");
        const posts = await collection.find(params).toArray();
        redidClient.set(req.originalUrl,  JSON.stringify(posts));
        res.status(200).json(posts);
    } catch (error) {
         console.log(error);
         res.status(500).json({error: error.message});
         
    }
}
);

app.get("/comments" , redisMidelware,async (req,res) => {
    try {
        const params = req.query;
        console.log(params)
        const collection = mongoose.connection.db.collection("comments");
        const comments = await collection.find(params).toArray();
        redidClient.set(req.originalUrl,  JSON.stringify(comments));
        res.status(200).json(comments);
    } catch (error) {
         console.log(error);
         res.status(500).json({error: error.message});
         
    }
}
);








const start = async () => {
    await mongoose.connect("mongodb://localhost:27017/PROXYSERVER").then(() => {
        console.log("Connected to the database!");
       
      }
    ).catch(err => {
        console.log("Cannot connect to the database!", err);
        process.exit();
      });

   app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});  
}






start() ;

