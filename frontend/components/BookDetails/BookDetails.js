import { useEffect, useState} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import "./BookDetails.css";
import CommunityReviews from "../CommunityReviews";

const BookDetails = () => {
  const { id } = useParams(); // Preluăm ID-ul cărții din URL
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingStatus, setReadingStatus] = useState("");
  const [owned, setOwned] = useState(false);
  const [format, setFormat] = useState("");
  const [showFormatPopup, setShowFormatPopup] = useState(false);
  const [seriesBooks, setSeriesBooks] = useState([]);
  const [series, setSeries] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [userPages, setUserPages] = useState('');
  const [reviewsData, setReviewsData] = useState(null);

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
  console.log("user id: ", userId);

    useEffect(() => {
      const fetchReviewStats = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/reviews/stats/${id}`
        );
        setReviewsData(response.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setReviewsData({
            totalReviews: 0,
            message: 'No reviews yet'
          });
        } else {
          console.error("Error fetching review stats:", error);
        }
      }
    };
      
      fetchReviewStats();
    }, [id]);

  useEffect(() => {
    setBook(null);
    setReadingStatus("");
    setShowPageInput(false);
    setUserPages('');
    setIsDescriptionExpanded(false);
    setLoading(true);
    const fetchBookDetails = async () => {
      try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`);
        const bookData = response.data;
        setBook(bookData);
      try {
        const checkResponse = await axios.get(
          `http://localhost:3001/api/books/google/${id}`
        ).catch(error => {
          if (error.response?.status === 404) {
            return { data: { exists: false } };
          }
          throw error;
        });
        
        if (checkResponse.data.exists) {
          const bookId = checkResponse.data.book.id;
          const statusResponse = await axios.get(
            `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${bookId}`
          );
          
          if (statusResponse.data.exists) {
            setReadingStatus(statusResponse.data.data.status);

            if(statusResponse.data.data.status === "currently_reading"){
              setShowPageInput(true);
              setUserPages(statusResponse.data.data.pages || bookData.volumeInfo?.pageCount || '');
            }
          }
        }
      } catch (error) {
        console.error("Error fetching reading status:", error);
      }
      
      setLoading(false);

      } catch (error) {
        console.error("Eroare la încărcarea detaliilor cărții:", error);
        setLoading(false);
      }
    };
  
    fetchBookDetails();
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setReadingStatus(newStatus);
  
    try {
      let bookId;

      if (newStatus === "currently_reading") {
        setShowPageInput(true); 
      } else {
        setShowPageInput(false);
      }
  
      const pageCount = book?.volumeInfo?.pageCount || 0;
      const checkResponse = await axios.get(
        `http://localhost:3001/api/books/google/${id}`
      ).catch(error => {
        if (error.response?.status === 404) {
          return { data: { exists: false } }; 
        }
        throw error;
      });
  
      if (!checkResponse.data.exists) {
        if (!book || !book.volumeInfo) {
          console.error("📌 Eroare: book.volumeInfo nu este disponibil.");
          return;
        }
  
        const { 
          title, 
          authors, 
          description, 
          imageLinks, 
        } = book.volumeInfo;

        const newBookData = {
          google_books_id: id,
          title: title || 'Necunoscut',
          authors: authors?.join(', ') || 'Autor necunoscut',
          description: description?.replace(/<\/?[^>]+(>|$)/g, "") || '',
          cover_image: imageLinks?.thumbnail || '',
          page_count: pageCount 
        };
  
        console.log("📌 Adăugare carte nouă:", newBookData);
  
        const createResponse = await axios.post(
          'http://localhost:3001/api/books',
          newBookData
        );
  
        bookId = createResponse.data.id;
      } else {
        bookId = checkResponse.data.book.id;
      }
  
      let existingStatus = null;

      console.log(bookId);
      console.log(userId);
  
      try {
        const statusResponse = await axios.get(
          `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${bookId}`
        );

        if (statusResponse.data.exists) {
          existingStatus = statusResponse.data.data;
        } else {
          console.log("Status nu exista - vom crea unul nou");
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log("Status nu exista - vom crea unul nou");
        } else {
          console.error("Eroare la verificarea statusului:", error);
          throw error;
        }
      }
  
      const now = new Date().toISOString();
      const updateData = {
        status: newStatus,
        pages: pageCount,
      };
  
      if (newStatus === "currently_reading") {
        updateData.currently_reading_start_date = now;
      } else if (newStatus === "read") {
        updateData.read_finish_date = now;
        updateData.page_counter = pageCount; 
      }
      if (existingStatus) {
        await axios.put(
          `http://localhost:3001/api/readingstatuses/${existingStatus.id}`,
          updateData
        );

      if (newStatus === "currently_reading") {
        await axios.put(
          `http://localhost:3001/api/readingstatuses/${existingStatus.id}/start-date`,
          { currently_reading_start_date: now }
        );
      } else if (newStatus === "read") {
        await axios.put(
          `http://localhost:3001/api/readingstatuses/${existingStatus.id}/finish-date`,
          { 
            read_finish_date: now,
            page_counter: pageCount
          }
        );
      }
      } else {
        const createData = {
          ...updateData,
          book_id: bookId,
          user_id: userId
        };
  
        if (newStatus === "currently_reading") {
          createData.currently_reading_start_date = now;
        } else if (newStatus === "read") {
          createData.read_finish_date = now;
          createData.page_counter = pageCount;
        }
  
        await axios.post(`http://localhost:3001/api/readingstatuses`, createData);
      }
    } catch (error) {
      console.error("Eroare la actualizarea statusului de citire:", error);
    }
  };

  const handleRemoveFromShelf = async () => {
  try {
    // 1. Check if the book exists in our database
    const checkResponse = await axios.get(
      `http://localhost:3001/api/books/google/${id}`
    ).catch(error => {
      if (error.response?.status === 404) {
        return { data: { exists: false } };
      }
      throw error;
    });

    if (checkResponse.data.exists) {
      const bookId = checkResponse.data.book.id;
      
      // 2. Check if there's a reading status for this book/user
      const statusResponse = await axios.get(
        `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${bookId}`
      );

      if (statusResponse.data.exists) {
        // 3. Delete the reading status
        await axios.delete(
          `http://localhost:3001/api/readingstatuses/${statusResponse.data.data.id}`
        );
        
        // 4. Update local state
        setReadingStatus("");
        setShowPageInput(false);
        setUserPages('');
      }
    }
  } catch (error) {
    console.error("Error removing from shelf:", error);
  }
};

  const handleOwnedChange = () => {
    setOwned(!owned);
    if (!owned) {
      setShowFormatPopup(true);
    } else {
      setFormat("");
    }
  };

  const handleSavePages = async () => {
    const pages = parseInt(userPages) || book?.volumeInfo?.pageCount || 0;
     try {
    // 1. Verificăm din nou statusul existent (deși știm că există)
    const checkResponse = await axios.get(
      `http://localhost:3001/api/books/google/${id}`
    );

    // 2. Obținem ID-ul cărții din baza noastră de date
    const bookId = checkResponse.data.book.id;

    // 3. Obținem statusul existent de citire
    const statusResponse = await axios.get(
      `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${bookId}`
    );

    // 4. Facem update direct la numărul de pagini folosind ruta dedicată
    await axios.put(
      `http://localhost:3001/api/readingstatuses/${statusResponse.data.data.id}/pages`,
      { pages }
    );

    // 5. Actualizăm starea locală
    setReadingStatus("currently_reading");
    setShowPageInput(false);
    
    // Opțional: Resetăm input-ul
    setUserPages('');
  } catch (error) {
    console.error("Eroare la actualizarea paginilor:", error);
    // Poți adăuga aici o notificare pentru utilizator
  }
  };

    const saveReadingStatus = async (status, pages) => {
    try {
        let bookId;
        const pageCount = book?.volumeInfo?.pageCount || 0;

        const bookCheck = await axios.get(
          `http://localhost:3001/api/books/google/${id}`
        ).catch(err => {
          if (err.response?.status === 404) return { data: { exists: false } };
          throw err;
        });
    
        
        console.log(`Salvare status: ${status} cu ${pages} pagini`);
      // ... restul codului tău existent ...
    } catch (error) {
      console.error("Eroare la salvarea statusului:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!book) return <p>Book not found.</p>;
  
  
  const { title, authors, description, imageLinks, pageCount, 
    publishedDate, 
    categories,
    averageRating} = book.volumeInfo || {};
  const publicationYear = publishedDate ? new Date(publishedDate).getFullYear() : null;

  const cleanDescription = description ? description.replace(/<\/?[^>]+(>|$)/g, "") : "";

const processGenres = (categories) => {
  // Verificăm mai întâi dacă avem categorii valide
  if (!categories || !Array.isArray(categories)) return [];
  
  const allGenres = [];
  
  // Procesăm fiecare categorie cu mai multă protecție împotriva erorilor
  categories.forEach(category => {
    if (typeof category === 'string') {
      const subgenres = category.split('/')
        .map(genre => genre.trim())
        .filter(genre => genre.length > 0); // Ignoră stringurile goale
      
      allGenres.push(...subgenres);
    }
  });
  
  // Dacă nu avem genuri, returnăm array gol
  if (allGenres.length === 0) return [];
  
  // Numărăm aparițiile fiecărui gen
  const genreCounts = {};
  allGenres.forEach(genre => {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  });
  
  // Sortăm și returnăm top 5
  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)
    .slice(0, 5);
};

  const topGenre = processGenres(categories);



  return (
    <div className="book-details-container">
      <div className="book-header">
        <div className="book-cover-container">
          <img 
            src={imageLinks?.thumbnail || '/default-cover.jpg'} 
            alt={title}
            className="book-cover"
          />
        </div>

        <div className="book-meta">
          <h2>{title}</h2>
          
          <div className="authors">
            {authors?.map((author, index) => (
              <span key={author} className="author"  onClick={() => navigate(`/author/${encodeURIComponent(author)}`)}>
                {author}
                {index < authors.length - 1 && ', '}
              </span>
            ))}
          </div>

          <div className="stats-grid">
            {pageCount && (
              <div className="stat-item">
                <span className="stat-label">Pages</span>
                <span className="stat-value">{pageCount}</span>
              </div>
            )}

            {publicationYear && (
              <div className="stat-item">
                <span className="stat-label">Published</span>
                <span className="stat-value">{publicationYear}</span>
              </div>
            )}

            {averageRating && (
              <div className="stat-item">
                <span className="stat-label">Rating</span>
                <span className="stat-value">
                  {averageRating}/5
                </span>
              </div>
            )}
          </div>

          {topGenre.length >0 && (
            <div className="genres">
              {topGenre.map((genre, index) => (
                <span key={genre} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="status-section">
            <select 
              value={readingStatus} 
              onChange={handleStatusChange}
              className="status-dropdown"
            >
              <option value="">Select status...</option>
              <option value="read">Read</option>
              <option value="currently_reading">Currently reading</option>
              <option value="want_to_read">Want to read</option>
              <option value="dnf">DNF</option>
            </select>

            {readingStatus === "read" && (
              <Link 
                to={`/book/${id}/review`} 
                className="review-button"
              >
                Add review
              </Link>
            )}
          </div>

          {readingStatus && (
              <button 
                onClick={handleRemoveFromShelf} 
                className="remove-btn"
              >
                Remove from shelf
              </button>
            )}
          {showPageInput && (
            <div className="page-input-section">
              <p>How many pages does your book have?</p>
              <input 
                type="number" 
                value={userPages}
                onChange={(e) => setUserPages(e.target.value)}
                placeholder={book?.volumeInfo?.pageCount || "Enter pages"}
              />
              <button onClick={handleSavePages} className="save-btn">
                Save Pages
              </button>
            </div>
          )}
          <Link 
            to={`/ownedbookformular/${id}`}
            className="review-button">
            Add in My Library
          </Link>
        </div>
      </div>

      {cleanDescription && (
        <div className="description-section">
          <h2>Description</h2>
          <p className="book-description">
            {isDescriptionExpanded 
              ? cleanDescription 
              : cleanDescription.slice(0, 200) + (cleanDescription.length > 200 ? "..." : "")
            }
          </p>
          {cleanDescription.length > 200 && (
            <button 
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="read-more-btn"
            >
              {isDescriptionExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </div>
      )}
      {reviewsData && <CommunityReviews reviewsData={reviewsData} />}
    </div>
  );
};
export default BookDetails;