const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt= require('jsonwebtoken')
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// middle wares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tcnszhx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function veryfyJWT (req,res,next){
    const authHeaders = req.headers.authorization;
    if(!authHeaders){
       return res.status(401).send({message:'unauthorized access'})
    }
    const token = authHeaders.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err,decoded){
        if(err){
            res.status(401).send({message:'unauthorized access'})
        }
        req.decoded = decoded
        next()
    })
}

async function run() {
    try {
        const serviceCollection = client.db('geniusCar').collection('services')
        const orderCollection = client.db('geniusCar').collection('orders')

        app.post('/jwt',(req,res)=>{
            const user = req.body;
            const token =jwt.sign(user,process.env.ACCESS_TOKEN, {expiresIn:'1d'})
            res.send({token})
        })
       app.get('/services',async (req,res)=>{
        const query ={}
        const cursor = serviceCollection.find(query)
        const services = await cursor.toArray()
        res.send(services)
       })
       app.get('/services/:id', async(req,res)=>{
        const id  = req.params.id;
        const query = {_id:ObjectId(id)}
        const service = await serviceCollection.findOne(query)
        res.send(service)
       })
       //    orders api

       app.post('/orders', async (req,res)=>{
        const query = req.body;
        
        const result = await orderCollection.insertOne(query)
        res.send(result)
       })


       app.get('/orders',veryfyJWT, async(req,res)=>{
        const decoded = req.decoded;
         if(decoded.email !== req.query.email){
            res.status(403).send({message:'unauthorized access'})
         }
        let query= {}
        if(req.query.email){
            query = {
                email : req.query.email
            }
        }
        const cursor = orderCollection.find(query)
        const order = await cursor.toArray()
        res.send(order)
       })

       app.patch('/orders/:id',veryfyJWT, async(req,res)=>{
        const id = req.params.id;
        const status= req.body.status;
        const query = {_id:ObjectId(id)}
        const updateDoc = {
            $set:{
                status:status
            }
        }
        const result = await orderCollection.updateOne(query,updateDoc)
        res.send(result)
       })
       app.delete('/orders/:id',veryfyJWT, async(req,res)=>{
        const id = req.params.id;
        const query= {_id:ObjectId(id)}
        const result = await orderCollection.deleteOne(query)
        res.send(result)
       })
    }
    finally {

    }

}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('genius car server is running')
})

app.listen(port, () => {
    console.log(`Genius server running on ${port}`);
})