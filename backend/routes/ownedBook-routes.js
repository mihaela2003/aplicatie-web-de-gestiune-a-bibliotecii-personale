const express = require("express");
const {
  addOwnedBook,
  getOwnedBooks,
  updateOwnedBook,
  deleteOwnedBook,
  searchOwnedBooks
} = require("../controllers/ownedBook-controller");

const router = express.Router();

router.post("/", addOwnedBook);
router.get("/user/:userId", getOwnedBooks);
router.get("/search/:userId", searchOwnedBooks);
router.put("/:id", updateOwnedBook);
router.delete("/:id", deleteOwnedBook);

module.exports = router;