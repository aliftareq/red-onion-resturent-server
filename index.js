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
const billingsCollection = client.db('powerHack').collection('billings')

//common funcions 

//1
function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            console.log(err);
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded
        next()
    })
}

//api's / endspoints

//root api
app.get('/', (req, res) => {
    res.send('powerHack server is running')
})

//api for getting billing list.
app.get('/billing-list', verifyJwt, async (req, res) => {
    try {
        const page = req.query.page
        const query = {}
        const billList = await billingsCollection.find(query).sort({ _id: -1 }).skip(page * 10).limit(10).toArray()
        const count = await billingsCollection.estimatedDocumentCount()
        res.send({ count, billList })
    }
    catch (error) {
        res.send(error.message)
    }
})

//api for getting a single bill 
app.get('/bill', verifyJwt, async (req, res) => {
    try {
        const id = req.query.id
        const query = { _id: ObjectId(id) }
        const bill = await billingsCollection.findOne(query)
        res.send(bill)
    }
    catch (error) {
        res.send(error.message)
    }
})

//api for posting single bookings of client
app.post('/add-billing', verifyJwt, async (req, res) => {
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

//api for deleting bill
app.delete('/delete-billing/:id', verifyJwt, async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const result = await billingsCollection.deleteOne(query)
        res.send(result)
    }
    catch (error) {
        res.send(error.message)
    }
})

//-----------------------JWT token ---------------------//

//api for issue a access token
app.get('/jwt', async (req, res) => {
    try {
        const email = req.query.email
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '5h' })
        res.send({ accessToken: token })
    }
    catch (error) {
        res.send({ message: error.message })
    }
})

app.listen(port, () => {
    console.log(`This server is running on ${port}`);
})