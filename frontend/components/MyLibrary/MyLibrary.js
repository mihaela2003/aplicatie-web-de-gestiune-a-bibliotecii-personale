import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./MyLibrary.css";

const MyLibrary = () => {
  const [ownedBooks, setOwnedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    currentlyReading: 0,
    wantToRead: 0,
    dnf: 0
  });
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    language: ""
  });

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchOwnedBooks = async () => {
      try {
        const userId = getCurrentUserId();
        if (!userId) return;

        const response = await axios.get(`http://localhost:3001/api/ownedbooks/user/${userId}`);
        const books = response.data;

        console.log("owned books:", books);

        // Calculate reading stats
        const readingStats = {
          total: books.length,
          read: books.filter(b => b.ReadingStatus?.status === "read").length,
          currentlyReading: books.filter(b => b.ReadingStatus?.status === "currently_reading").length,
          wantToRead: books.filter(b => b.ReadingStatus?.status === "want_to_read").length,
          dnf: books.filter(b => b.ReadingStatus?.status === "dnf").length
        };

        setOwnedBooks(books);
        setStats(readingStats);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch your library");
        setLoading(false);
      }
    };

    fetchOwnedBooks();
  }, []);



  const applyFilters = () => {
    return ownedBooks.filter(book => {
      return (
        (filters.status === "" || book.ReadingStatus?.status === filters.status) &&
        (filters.type === "" || book.type === filters.type) &&
        (filters.language === "" || 
          (book.language && book.language.toLowerCase().includes(filters.language.toLowerCase())))
      );
    });
  };

  const getBookCover = (book) => {
    
    if (book.Book?.google_books_id) {
      return `https://books.google.com/books/content?id=${book.Book.google_books_id}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
    }
    
    // Copertă implicită
    return '/default-book-cover.jpg';
  };


  const filteredBooks = applyFilters();

  const handleBookClick = (googleBooksId) => {
    navigate(`/book/${googleBooksId}`);
  };

  if (loading) return <div className="loading">Loading your library...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-library-container">
      <div className="library-header">
        <div className="filter-section">
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="read">Read</option>
            <option value="currently_reading">Currently Reading</option>
            <option value="want_to_read">Want to Read</option>
            <option value="dnf">Did Not Finish</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="">All Types</option>
            <option value="Physical">Physical</option>
            <option value="Ebook">E-book</option>
            <option value="Audiobook">Audiobook</option>
          </select>

          <input
            type="text"
            placeholder="Filter by language"
            value={filters.language}
            onChange={(e) => setFilters({...filters, language: e.target.value})}
          />
        </div>
      </div>

      <div className="library-content">
        <div className="stats-section">
          <div className="stat-card">
            <h3>Total Books</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Read</h3>
            <p>{stats.read}</p>
          </div>
          <div className="stat-card">
            <h3>Currently Reading</h3>
            <p>{stats.currentlyReading}</p>
          </div>
          <div className="stat-card">
            <h3>Want to Read</h3>
            <p>{stats.wantToRead}</p>
          </div>
          <div className="stat-card">
            <h3>Did Not Finish</h3>
            <p>{stats.dnf}</p>
          </div>
        </div>

        <div className="books-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map(book => (
              <div key={book.id} className="book-card" onClick={() => handleBookClick(book.Book?.google_books_id)}>
                <img 
                  src={getBookCover(book)}
                  alt={book.Book?.title || 'Book cover'}
                  className="book-cover1"
                />
                <div className="book-info">
                  <h3>{book.Book?.title}</h3>
                  <p>{book.Book?.authors}</p>
                  <div className="book-meta1">
                    <span className={`status ${book.ReadingStatus?.status || 'unset'}`}>
                      {book.ReadingStatus?.status?.replace('_', ' ') || 'Not set'}
                    </span>
                    <span className="type">{book.type}</span>
                    {book.language && <span className="language">{book.language}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-books">No books match your filters</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLibrary;