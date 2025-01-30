const express = require('express');
const router = express.Router();


// USERS
// Index 
router.get("/", (req, res) => {
    res.send("Get for users")
})

// Show 
router.get("/:id", (req, res) => {
    res.send("Get for users id")
})

// Post 
router.post("/", (req, res) => {
    res.send("Post for users")
})

// Delete 
router.delete("/:id", (req, res) => {
    res.send("Delete for users id")
})

module.exports = router;