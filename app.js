const express = require('express');
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js")
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js")
const {listingSchema} = require("./schema.js");


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")))

async function main() {
    await mongoose.connect("mongodb://localhost:27017/wanderlust")
}

main().then(() => {
    console.log("connected to  DB")
})
    .catch((err) => {
        console.log(err)
    })

app.get("/", (req, res) => {
    res.send("I am root")
})

const validateListing = (req,res,next) =>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }
    else{
        next();
    }
}

//Index Route
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));


// New Route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
})

// Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
}))

// Create Route
app.post("/listings",validateListing, wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    // if(!newListing.description){
    //     throw new ExpressError(400, "Description is missing")
    // }
    // if(!newListing.title){
    //     throw new ExpressError(400, "Title is missing")
    // }
    // if(!newListing.location){
    //     throw new ExpressError(400, "Location is missing")
    // }

    await newListing.save();
    res.redirect("/listings")
}))

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));

// Update Route
app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;

    // Retrieve the original image URL from the request body
    const originalImage = req.body.originalImage;
    console.log("Original img ", originalImage);

    // Check if the image field is empty and retain the original if it is
    if (!req.body.listing.image || req.body.listing.image.trim() === '') {
        req.body.listing.image.url = originalImage;
    }

    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

// // // Update Route
// app.put("/listings/:id", wrapAsync(async (req, res) => {
//     if (!req.body.listing) {
//         throw new ExpressError(400, "Send valid data for listing");
//     }

//     let { id } = req.params;

//     // Retrieve the original image URL from the request body
//     const originalImage = req.body.originalImage;
//     console.log("Original img ",originalImage)
//     // Check if the image field is empty and retain the original if it is
//     if (!req.body.listing.image || req.body.listing.image.trim() === '') {
//         req.body.listing.image = originalImage;
//     }

//     // Update the listing with the new data
//     await Listing.findByIdAndUpdate(id, { ...req.body.listing });

//     // Redirect to the updated listing page
//     res.redirect(`/listings/${id}`);
// }));

// Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

// app.get("/testlisting", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     })
//     await sampleListing.save();
//     console.log("sample was saved")
//     res.send("succesful testing")
// })

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not find"))
})

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err });
})

app.listen(8080, () => {
    console.log("Server is listening")
})