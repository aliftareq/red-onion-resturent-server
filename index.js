const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');

require('colors')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000;

//middlewares
app.use(cors())
app.use(express.json())

//uri & client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.preca8g.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//db connection function
async function run() {
    try {
        client.connect()
        console.log('Database connected succesfully'.yellow.bold);
    }
    catch (error) {
        console.log(error.message.red.bold);
    }
}
run().catch(err => console.log(err.message.red.bold))

//collections
const usersCollection = client.db('powerHack').collection('Users')
const billingsCollection = client.db('powerHack').collection('billings')

//api's / endspoints

//root api
app.get('/', (req, res) => {
    res.send('powerHack server is running')
})

//api for getting billing list.
app.get('/billing-list', async (req, res) => {
    try {
        const page = req.query.page
        console.log(page);
        const query = {}
        const billList = await billingsCollection.find(query).sort({ _id: -1 }).skip(page * 10).limit(10).toArray()
        const count = await billingsCollection.estimatedDocumentCount()
        res.send({ count, billList })
    }
    catch (error) {
        res.send(error.message)
    }
})

//api for posting single bookings of client
app.post('/add-billing', async (req, res) => {
    try {
        const bill = req.body
        const result = await billingsCollection.insertOne(bill)
        res.send(result)
    }
    catch (error) {
        console.log(error);
        res.send(error.message)
    }
})

app.listen(port, () => {
    console.log(`This server is running on ${port}`);
})