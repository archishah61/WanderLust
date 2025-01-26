const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

async function main() {
    await mongoose.connect("mongodb://localhost:27017/wanderlust")
}

main()
    .then(() => {
        console.log("connected to  DB")
    })
    .catch((err) => {
        console.log(err)
    })

const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();