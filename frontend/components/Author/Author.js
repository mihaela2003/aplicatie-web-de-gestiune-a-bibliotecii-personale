import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import "./Author.css";

const AuthorPage = () => {
  const navigate = useNavigate();
  const { authorName } = useParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);

  const fetchBooksByAuthor = async (startIndex) => {
    console.log("Author: ", authorName);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=inauthor:${authorName}&startIndex=${startIndex}&maxResults=10`
      );

      // Verifică dacă există rezultate
      if (!response.data.items) {
        setHasMoreBooks(false); // Nu mai sunt cărți de încărcat
        setLoading(false);
        return;
      }

      // Extrage informațiile necesare
      const booksData = response.data.items.map((book) => {
        const volumeInfo = book.volumeInfo;
        return {
          id: book.id,
          title: volumeInfo.title || "Titlu necunoscut",
          authors: volumeInfo.authors || ["Autor necunoscut"],
          pageCount: volumeInfo.pageCount || "Necunoscut",
          categories: volumeInfo.categories || ["Fără gen"],
          thumbnail: volumeInfo.imageLinks?.thumbnail || "https://via.placeholder.com/128x196", // Placeholder dacă nu există copertă
        };
      });

      setBooks((prevBooks) => [...prevBooks, ...booksData]);
      setLoading(false);

      // Verifică dacă există mai multe cărți de încărcat
      if (booksData.length < 10) {
        setHasMoreBooks(false);
      }
    } catch (error) {
      console.error("Eroare la încărcarea cărților autorului:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksByAuthor(startIndex);
  }, [authorName]);

  const loadMoreBooks = () => {
    if (hasMoreBooks) {
      const currentScrollPosition = window.scrollY; // Salvează poziția curentă de scroll
      setStartIndex((prevIndex) => prevIndex + 10); // Încarcă următoarele 10 cărți
      // Ajustează scroll-ul după ce conținutul este încărcat
      setTimeout(() => {
        window.scrollTo(0, currentScrollPosition);
      }, 0);
    }
  };

  useEffect(() => {
    if (startIndex > 0) {
      fetchBooksByAuthor(startIndex);
    }
  }, [startIndex]);

  if (loading) return <p>Loading...</p>;
  if (!books.length) return <p>We did not find books written by this author.</p>;

  return (
    <div className="main-content">
      <div className="scrollable-content">
      <h1 className="page-title">{authorName}'s books</h1>
      
      <div className="books-container">
        {books.map((book) => (
          <div key={book.id} className="book-card-author" onClick={() => navigate(`/book/${book.id}`)} >
            <img
              src={book.thumbnail}
              alt={book.title}
              className="book-cover"
            />
            <div className="book-detail">
              <h2 className="book-title">{book.title}</h2>
              <p className="book-author">
                <strong>Author:</strong> {book.authors.join(", ")}
              </p>
              <p className="book-pages">
                <strong>Pages:</strong> {book.pageCount}
              </p>
              <p className="book-genres">
                <strong>Genres:</strong> {book.categories.join(", ")}
              </p>
            </div>
          </div>
        ))}
        </div>
      </div>

      {hasMoreBooks && (
        <button onClick={loadMoreBooks} className="load-more-button">
          Load more
        </button>
      )}
    </div>
  );
};

export default AuthorPage;