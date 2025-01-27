const express = require('express');
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js")
const Review = require("./models/review.js")
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js")
const { listingSchema } = require("./schema.js");


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

const validateListing = (req, res, next) => {
    console.log('in validate for put')
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else {
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
app.post("/listings", validateListing, wrapAsync(async (req, res, next) => {
    const { title, description, location, price, country, image } = req.body.listing;

    // Validate required fields
    if (!title) {
        throw new ExpressError(400, "Title is missing");
    }
    if (!description) {
        throw new ExpressError(400, "Description is missing");
    }
    if (!location) {
        throw new ExpressError(400, "Location is missing");
    }
    if (!price || isNaN(price)) {
        throw new ExpressError(400, "Price should be a valid number");
    }
    if (!country) {
        throw new ExpressError(400, "Country is missing");
    }
    if (!image || !image.startsWith("http")) {
        throw new ExpressError(400, "Image URL is invalid or missing");
    }

    // Create a new listing instance
    const newListing = new Listing(req.body.listing);

    // Save the listing to the database
    await newListing.save();
    console.log("New Listing added successfully")
    // Redirect to the listings page after successful addition
    res.redirect("/listings");
}));


//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));

// Update Route
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    console.log("In put route")
    // Retrieve the original image URL from the request body
    const originalImage = req.body.originalImage;
    console.log(req.body);
    // Check if the image field is empty and retain the original if it is
    if (!req.body.listing.image || req.body.listing.image.trim() === '') {
        req.body.listing.image = originalImage; // Assign originalImage directly
    }

    // Update the listing in the database
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // Redirect to the updated listing page
    res.redirect(`/listings/${id}`);
}));


// Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));


// Reviews 
// Post Route
app.post("/listings/:id/reviews", async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
})


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