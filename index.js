const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.3036qk8.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    maxPoolSize: 10,
  },
});
// JWT Verification
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.PUBLIC_URL}/api/auth/jwks`),
);

const verification = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(403).send({ error: true, message: "Forbidden access" });
  }
};

async function run() {
  try {
    const myDB = client.db("sportFacilities");
    const myFacilitiesColl = myDB.collection("facilities");
    const myBookingsColl = myDB.collection("bookings");

    app.get("/facilities", async (req, res) => {
      const result = await myFacilitiesColl.find().toArray();
      res.send(result);
    });

    app.get("/facilities/:id", verification, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myFacilitiesColl.findOne();
      res.send(result);
    });

    app.post("/facilities", verification, async (req, res) => {
      const data = req.body;
      const result = await myFacilitiesColl.insertOne(data);
      res.send(result);
    });

    app.delete("/deleteFacilities/:id", verification, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await myFacilitiesColl.deleteOne(query);
      res.send(result);
    });

    app.patch("/updateFacilities/:id", async (req, res) => {
      const updateData = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updateData,
      };
      const result = await myFacilitiesColl.updateOne(query, updateDoc);
      res.send(result);
    });

    app.get("/bookings/:id", async (req, res) => {
      const userId = req.params.id;
      const query = { userId: userId };
      const result = await myBookingsColl.find(query).toArray();
      res.send(result);
    });

    

    app.delete("/cancelBooking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myBookingsColl.deleteOne(query);
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

// Test route
app.get("/", (req, res) => {
  res.send("Welcome to Wanderlust Resources Server");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

run().catch(console.dir);
