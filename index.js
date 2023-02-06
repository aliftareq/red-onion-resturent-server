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
const foodsCollection = client.db('RedOnionResturent').collection('Foods')

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
    res.send('red-onion-resturent server is running')
})

//api for getting billing list.
app.get('/meals', async (req, res) => {
    try {
        const query = {}
        const data = await foodsCollection.find(query).toArray()
        res.send({ status: 200, data })
    }
    catch (error) {
        res.send(error.message)
    }
})

app.get('/meals/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const data = await foodsCollection.find({ Category: category }).toArray()
        res.send({ status: 200, data })
    }
    catch (error) {
        res.send(error.message)
    }
})

//get a specific meal by Id 
app.get('/meal/:mealId', async (req, res) => {
    const mealId = req.params
    //console.log(mealId);
    const meal = await foodsCollection.findOne({ _id: ObjectId(mealId.mealId) })
    res.send(meal)
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