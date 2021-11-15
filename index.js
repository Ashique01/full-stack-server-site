const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const cors = require('cors');
const { ObjectID } = require('bson');
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pbvkw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function run() {
    try {
        await client.connect();
        const database = client.db('kena_becha');
        const databaseCollection = database.collection('products');
        const databaseCollection1 = database.collection('reviews');
        const databaseOrderCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        console.log('database conmnected successfully')

        //get products api

        app.get('/products', async (req, res) => {
            const cursor = databaseCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        app.get('/reviews', async (req, res) => {
            const cursor = databaseCollection1.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        //post 
        app.post('/confirmOrder', async (req, res) => {
            const newOrder = await databaseOrderCollection.insertOne(req.body)
            res.send(newOrder)

        })
        app.post("/addProducts", async (req, res) => {
            const result = await databaseCollection.insertOne(req.body);
            res.send(result);
        });

        app.get('/myOrders/:email', async (req, res) => {
            const myOrders = await databaseOrderCollection.find({ email: req.params.email }).toArray()
            res.send(myOrders);
        })
        //cancel order

        app.delete('/cancelOrder/:id', async (req, res) => {
            const cancelOrder = await databaseOrderCollection.deleteOne({
                _id: ObjectID(req.params.id)
            })
            res.send(cancelOrder);
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        //all orders

        app.get("/allOrders", async (req, res) => {
            const result = await databaseOrderCollection.find({}).toArray();
            res.send(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        //update status
        app.put("/updateStatus/:id", (req, res) => {
            const id = req.params.id;
            const updatedStatus = req.body.status;
            const filter = { _id: ObjectID(id) };
            console.log(updatedStatus);
            databaseOrderCollection
                .updateOne(filter, {
                    $set: { status: updatedStatus },
                })
                .then((result) => {
                    res.send(result);
                });
        });
        app.delete('/allOrders/:id', async (req, res) => {
            const deleteOrder = await databaseOrderCollection.deleteOne({
                _id: ObjectID(req.params.id)
            })
            res.send(deleteOrder);
        })

        //admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);


        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

    }
    finally {
        //await client.close();
    }

}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running');
})
app.listen(port, () => {
    console.log('server running at port', port);
})