const axios = require("axios");
require("dotenv").config();
const Book = require('../models/Carti');

const HARDCOVER_TOKEN = process.env.HARDCOVER_TOKEN;

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const searchBooks = async (req, res) => {
  try {
    console.log("Cerere primita pentru cautare:", req.query);

    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: "Campul 'q' este necesar pentru cautare!" });
    }

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}&key=${API_KEY}`
    );

    console.log("Rezultate returnate:", response.data.items?.length || 0);
    res.json(response.data);
  } catch (error) {
    console.error(" Eroare la interogarea Google Books API:", error);
    res.status(500).json({ message: "Eroare la cautarea cărtilor", error });
  }
};

const getSeriesInfo = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ message: "Titlul este necesar pentru a găsi seria!" });
    }

    console.log("📚 Titlu pentru căutare:", title);

    const query = `
      query {
        search(
          query: "${title}",
          query_type: "Series",
          per_page: 7,
          page: 1
        ) {
          results {
            document {
              name
              books
              author_name
            }
          }
        }
      }
    `;

    const response = await axios({
      url: "https://api.hardcover.app/graphql",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HARDCOVER_TOKEN}`,
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ query })
    });

    const seriesData = response.data.data.search.results[0]?.document;
    
    if (seriesData) {
      res.json({
        seriesTitle: seriesData.name,
        seriesBooks: seriesData.books
      });
    } else {
      res.status(404).json({ message: "Seria nu a fost găsită." });
    }
  } catch (error) {
    console.error("Eroare la obținerea seriei:", error.response?.data || error.message);
    res.status(500).json({ message: "Eroare la preluarea informațiilor despre serie", error: error.message });
  }
};

// Create a new book
const createBook = async (req, res) => {
  try {
      const { 
          title, 
          authors, 
          description, 
          cover_image, 
          google_books_id 
      } = req.body;
      
      const book = await Book.create({ 
          title,
          authors,
          description,
          cover_image,
          google_books_id
      });
      
      res.status(201).json(book);
  } catch (error) {
      res.status(500).json({ message: 'Eroare la crearea cărții', error });
  }
};

// Get all books
const getAllBooks = async (req, res) => {
  try {
      const books = await Book.findAll();
      res.status(200).json(books);
  } catch (error) {
      res.status(500).json({ message: 'Eroare la obținerea cărților', error });
  }
};

// Get a single book by ID
const getBookById = async (req, res) => {
  try {
      const { id } = req.params;
      const book = await Book.findByPk(id);
      if (book) {
          res.status(200).json(book);
      } else {
          res.status(404).json({ message: 'Carte negăsită' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Eroare la obținerea cărții', error });
  }
};

// Update a book
const updateBook = async (req, res) => {
  try {
      const { id } = req.params;
      const { title, published_date, is_physical, is_digital } = req.body;
      const [updated] = await Book.update({ title, published_date, is_physical, is_digital }, {
          where: { id }
      });
      if (updated) {
          const updatedBook = await Book.findByPk(id);
          res.status(200).json(updatedBook);
      } else {
          res.status(404).json({ message: 'Carte negăsită' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Eroare la actualizarea cărții', error });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
      const { id } = req.params;
      const deleted = await Book.destroy({
          where: { id }
      });
      if (deleted) {
          res.status(204).send();
      } else {
          res.status(404).json({ message: 'Carte negăsită' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Eroare la ștergerea cărții', error });
  }
};

const getBookByGoogleId = async (req, res) => {
  try {
    const { googleId } = req.params;
    
    if (!googleId || googleId.length < 5) {
      return res.status(400).json({ message: "ID Google invalid" });
    }

    console.log("Book model:", Book);

    if (!Book) {
      return res.status(500).json({ 
        exists: false,
        message: "Eroare: Modelul Book nu este definit în backend!" 
      });
    }

    const book = await Book.findOne({ 
      where: { google_books_id: googleId },
      logging: console.log
    });

    if (!book) {
      return res.status(404).json({ 
        exists: false,
        message: "Cartea nu există în baza noastră" 
      });
    }
    
    res.json({ exists: true, book: book.toJSON() });
  } catch (error) {
    console.error("Eroare DB:", error.original || error);
    res.status(500).json({ 
      message: 'Eroare la căutare',
      details: error.original ? error.original.message : error.message 
    });
  }
};

module.exports = {
    searchBooks,
    getSeriesInfo,
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook,
    getBookByGoogleId
};