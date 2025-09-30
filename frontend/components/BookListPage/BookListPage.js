import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import "./BookListPage.css"; // Optional: CSS specific pentru această pagină

const BookListPage = () => {
  const [books, setBooks] = useState([]);
  const [covers, setCovers] = useState({});
  const { status } = useParams(); // Extrage statusul din URL (ex: /read, /want-to-read etc.)
  const navigate = useNavigate();
  const getCurrentUserId = () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      try {
        const decoded = jwtDecode(token);
        return decoded.userId;
      } catch (error) {
        console.error('Eroare decodare token:', error);
        return null;
      }
    };
  
    const userId = getCurrentUserId(); 

  // Titluri custom în funcție de status
  const pageTitles = {
    read: "Read Books",
    "want_to_read": "Want to Read",
    dnf: "Did Not Finish (DNF)",
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/readingstatuses/user/${userId}`
        );
        const filteredBooks = response.data.filter(
          (book) => book.status === status
        );
        setBooks(filteredBooks);
        fetchCovers(filteredBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };
    fetchBooks();
  }, [status, userId]);

  const fetchCovers = async (books) => {
    const newCovers = {};
    const requests = books.map(async (book) => {
      if (book.google_books_id) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes/${book.google_books_id}`
          );
          newCovers[book.google_books_id] = response.data.volumeInfo.imageLinks?.thumbnail || "";
        } catch (error) {
          console.error(`Eroare la încărcarea coperții pentru ${book.title}:`, error);
        }
      }
    });

    await Promise.all(requests);
    setCovers(newCovers);
  };

  const handleBookClick = (googleBooksId) => {
    navigate(`/book/${googleBooksId}`);
  };

  return (
    <div className="book-list-page">
      <h1>{pageTitles[status]}</h1>
      <div className="book-grid">
        {books.map((book) => (
          <div
            key={book.id}
            className="book-item"
            onClick={() => handleBookClick(book.google_books_id)}
          >
            <img
              src={covers[book.google_books_id] || "default-cover.jpg"}
              alt={book.title}
            />
            <p>{book.title}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate("/homepage")}>Back to Home</button>
    </div>
  );
};

export default BookListPage;