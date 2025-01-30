const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js")
const Listing = require("../models/listing.js")


const validateListing = (req, res, next) => {
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
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));


// New Route
router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
})

// Show Route
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
}))

// Create Route
router.post("/", validateListing, wrapAsync(async (req, res, next) => {
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
router.get("/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));

// Update Route
router.put("/:id", validateListing, wrapAsync(async (req, res) => {
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
router.delete("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

module.exports = router;