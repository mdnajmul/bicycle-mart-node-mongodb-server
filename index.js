const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const app = express();

//PORT
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3u7yr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    const database = client.db("bicycle_mart");
    const productsCollection = database.collection("products");
    const usersCollection = database.collection("users");
    const productBookingCollection = database.collection("orders");
    const reviewCollection = database.collection("reviews");

    //GET API (Fetch all products from database)
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });

    // get single product
    app.get("/products/:id", async (req, res) => {
      const result = await productsCollection
        .find({ _id: ObjectId(req.params.id) })
        .toArray();
      console.log(result);
      res.send(result);
    });

    //GET API (Fetch users by email)
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      const role = user.role ? "admin" : "";
      if (role) {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    //Add Products
    app.post("/addproduct", async (req, res) => {
      const result = await productsCollection.insertOne(req.body);
      res.json(result);
    });

    //POST API (add user inside database)
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    //PUT API (update user information to database)
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    app.put("/users/makeAdmin", async (req, res) => {
      const userEmail = req.query.useremail;
      const user = req.body;
      if (user) {
        const requesterAccount = await usersCollection.findOne({
          email: userEmail,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have access to make admin" });
      }
    });

    // delete product
    app.delete("/delteProduct/:id", async (req, res) => {
      const result = await productsCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.send(result);
    });

    // cofirm order
    app.post("/confirmOrder", async (req, res) => {
      const result = await productBookingCollection.insertOne(req.body);
      res.send(result);
    });

    //Get All Order
    app.get("/allOrders", async (req, res) => {
      const result = await productBookingCollection.find({}).toArray();
      res.send(result);
    });

    // Get All MY Orders
    app.get("/myOrders/:email", async (req, res) => {
      const email = req.params.email;
      const result = await productBookingCollection
        .find({ email: email })
        .toArray();
      res.send(result);
    });

    // delete order
    app.delete("/delteOrder/:id", async (req, res) => {
      const result = await productBookingCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.send(result);
    });

    // update status
    app.put("/updateStatus/:id", (req, res) => {
      const id = req.params.id;
      const updatedStatus = "shipped";
      const filter = { _id: ObjectId(id) };
      productBookingCollection
        .updateOne(filter, {
          $set: { status: updatedStatus },
        })
        .then((result) => {
          res.send(result);
        });
    });

    //Fetch all reviews from database
    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find({}).toArray();
      res.send(result);
    });

    //Add Review
    app.post("/addreview", async (req, res) => {
      const result = await reviewCollection.insertOne(req.body);
      res.json(result);
    });
  } finally {
    //await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bicycle Mart Node Server Connect.");
});

app.get("/hello", (req, res) => {
  res.send("Hello Test");
});

app.listen(port, () => {
  console.log("Server running at port ", port);
});
