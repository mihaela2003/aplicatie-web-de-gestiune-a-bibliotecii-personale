import React, { useEffect, useState, useRef} from "react";
import { useNavigate} from "react-router-dom";
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import "./HomePage.css";

const HomePage = () => {
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [readBooks, setReadBooks] = useState([]);
  const [wantToRead, setWantToRead] = useState([]);
  const [dnfBooks, setDnfBooks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("Fantasy"); // Default genre
  const [covers, setCovers] = useState({}); // Stocăm imaginile pentru cărți
  const [selectedBook, setSelectedBook] = useState(null);
  const [pagesRead, setPagesRead] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showProgressSection, setShowProgressSection] = useState(false);
  const [currentReadingStatus, setCurrentReadingStatus] = useState(null);
  const [streakDays, setStreakDays] = useState({
  Monday: false,
  Tuesday: false,
  Wednesday: false,
  Thursday: false,
  Friday: false,
  Saturday: false,
  Sunday: false
});


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
  console.log("user id: ", userId);

const [currentSlide, setCurrentSlide] = useState(0);
const carouselTrackRef = useRef(null);
const carouselContainerRef = useRef(null);

const handleNext = () => {
    const maxSlides = Math.ceil(currentlyReading.length / 4) - 1;
    console.log("Current slide:", currentSlide, "Max slides:", maxSlides);
    setCurrentSlide(prev => Math.min(prev + 1, maxSlides));
  };
  
  const handlePrev = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    
    const fetchBooks = async () => {
        try {
          const response = await axios.get(`http://localhost:3001/api/readingstatuses/user/${userId}`);
          console.log('API response:', response.data);
         
            console.log('books response:', response.data);
            const books = Array.isArray(response.data) ? response.data : [response.data];

            console.log("books[0]: ",books[0]);
            
            setCurrentlyReading(books.filter((b) => b.status === "currently_reading"));
            setReadBooks(books.filter((b) => b.status === "read"));
            setWantToRead(books.filter((b) => b.status === "want_to_read"));
            setDnfBooks(books.filter((b) => b.status === "dnf"));
          
            fetchCovers(books);
        } catch (error) {
              console.error("Error fetching books:", error);
        }
      };
    fetchBooks();
  }, [userId]);

  console.log("Currently reading", currentlyReading);
  console.log("Currently reading detailed:", currentlyReading.map((book, index) => ({
    index,
    readingStatusId: book.id,
    bookId: book.book_id,
    title: book.title
  })));

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

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

const handleDayClick = (day) => {
  setStreakDays(prev => ({...prev, [day]: !prev[day]}));
};

const handleMarkToday = async () => {
  const pages = Number(pagesRead);
  if (pagesRead && userId && selectedBook) {
    try {
      const statusResponse = await axios.get(
        `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${selectedBook.bookId}`
      );

      if (!statusResponse.data.exists) {
        throw new Error('Reading status not found');
      }
      const existingStatus = statusResponse.data.data;
      
      await axios.put(
        `http://localhost:3001/api/readingstatuses/${selectedBook.readingStatusId}/page-counter`,
        { page_counter: pages }
      );

      await axios.post(`http://localhost:3001/api/readingStreak/${userId}`, {
        pagesRead: pages
      });

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      setStreakDays(prev => ({ ...prev, [today]: true }));
      
      setPagesRead('');
      setSelectedBook(null);
      
      const streakResponse = await axios.get(`http://localhost:3001/api/readingStreak/${userId}`);
      setCurrentStreak(streakResponse.data.current_streak);
      if (streakResponse.data.activeDays) {
        setStreakDays(streakResponse.data.activeDays);
      }
      
      const booksResponse = await axios.get(`http://localhost:3001/api/readingstatuses/user/${userId}`);
      setCurrentlyReading(booksResponse.data.filter((b) => b.status === "currently_reading"));
    } catch (error) {
      console.error('Eroare:', error.response?.data || error.message);
    }
  }
};

const handleFinishBook = async () => {
  if (selectedBook && userId) {
    try {
      const statusResponse = await axios.get(
        `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${selectedBook.bookId}`
      );

      if (!statusResponse.data.exists) {
        throw new Error('Reading status not found');
      }

      const existingStatus = statusResponse.data.data;
      const currentDate = new Date().toISOString();

      await axios.put(
        `http://localhost:3001/api/readingstatuses/${selectedBook.readingStatusId}`,
        { 
          status: 'read'
        }
      );

      await axios.put(
        `http://localhost:3001/api/readingstatuses/${selectedBook.readingStatusId}/finish-date`,
        { 
          read_finish_date: currentDate
        }
      );

      await axios.put(
        `http://localhost:3001/api/readingstatuses/${selectedBook.readingStatusId}/page-counter`,
        { 
          page_counter: selectedBook.pages || existingStatus.pages
        }
      );

      const booksResponse = await axios.get(`http://localhost:3001/api/readingstatuses/user/${userId}`);
      setCurrentlyReading(booksResponse.data.filter((b) => b.status === "currently_reading"));
      setReadBooks(booksResponse.data.filter((b) => b.status === "read"));
      
      setSelectedBook(null);
      setShowProgressSection(false);
      setPagesRead(0);
    } catch (error) {
      console.error('Eroare la marcarea cărții ca citită:', error);
    }
  }
};

useEffect(() => {
  const fetchStreak = async () => {
    if (userId) {
      try {
        const response = await axios.get(`http://localhost:3001/api/readingStreak/${userId}`);
        setCurrentStreak(response.data.current_streak);
        if (response.data.activeDays) {
          setStreakDays(response.data.activeDays);
        }
      } catch (error) {
        console.error('Eroare:', error.response?.data || error.message);
      }
    }
  };
  fetchStreak();
}, [userId]);


const handleBookSelect = async (book) => {
  console.log("Book selected - ID:", book.id, "Title:", book.title);
  try {
    const response = await axios.get(
      `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${book.book_id}`
    );

    console.log(response.data.data);
    
    if (response.data.exists) {
      setSelectedBook({
        ...book,
        readingStatusId: response.data.data.id,
        bookId: response.data.data.book_id,
        pages: response.data.data.pages,
        page_counter: response.data.data.page_counter
      });

    } else {
      setSelectedBook(book);
    }
          console.log('Selected book:', {
            id: selectedBook?.id,
            readingStatusId: selectedBook?.readingStatusId,
            bookId: selectedBook?.bookId,
            pages: selectedBook?.pages,
            page_counter: selectedBook?.page_counter
          });
  } catch (error) {
    console.error('Error fetching book details:', error);
    setSelectedBook(book);
  }
};

const handleDNFBook = async () => {
  if(selectedBook && userId){
    try {
          const statusResponse = await axios.get(
        `http://localhost:3001/api/readingstatuses/by-book-user/${userId}/${selectedBook.bookId}`
      );

      if (!statusResponse.data.exists) {
        throw new Error('Reading status not found');
      }

      console.log("status response:", statusResponse.data.data);

      const existingStatus = statusResponse.data.data;

      await axios.put(
        `http://localhost:3001/api/readingstatuses/${selectedBook.readingStatusId}`,
        { 
          status: 'dnf'
        }
      );

      const booksResponse = await axios.get(`http://localhost:3001/api/readingstatuses/user/${userId}`);
      setCurrentlyReading(booksResponse.data.filter((b) => b.status === "currently_reading"));
      setDnfBooks(booksResponse.data.filter((b) => b.status === "dnf"));
      
      setSelectedBook(null);
      setShowProgressSection(false);
      setPagesRead(0);
    } catch (error) {
      console.error('eroare la marcare cartii ca dnf', error);
    }
  }
};

const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

const getMostCommonGenre = async (books) => {
  if (!books || books.length === 0) return "Fantasy"; 
  
  const genreCounter = {};
  
  await Promise.all(
    books.map(async (book) => {
      try {
        if (book.google_books_id) {
          const res = await axios.get(`https://www.googleapis.com/books/v1/volumes/${book.google_books_id}`);
          const info = res.data.volumeInfo;
          
          const primaryGenre = info.categories?.[0]?.split('/')[0]?.trim() || 'Unknown';
          genreCounter[primaryGenre] = (genreCounter[primaryGenre] || 0) + 1;
        }
      } catch (err) {
        console.error(`Error processing ${book.google_books_id}:`, err);
      }
    })
  );
  
  const sortedGenres = Object.entries(genreCounter).sort((a, b) => b[1] - a[1]);
  console.log("sorted genres", sortedGenres);
  return sortedGenres.length > 0 ? sortedGenres[0][0] : "Fantasy";
};

const fetchRecommendations = async () => {
  setIsGeneratingRecommendations(true);
  try {
    const mostCommonGenre = await getMostCommonGenre(readBooks);
    const randomStartIndex = Math.floor(Math.random() * 30);
    
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(mostCommonGenre)}&maxResults=8&startIndex=${randomStartIndex}&key=AIzaSyCKHWEoauDiOaYWpHpldsRPztcByw0Xxxc`
    );
    
    const recommendedBooks = response.data.items?.filter(book => {
      return ![
        ...readBooks,
        ...currentlyReading,
        ...dnfBooks
      ].some(userBook => userBook.google_books_id === book.id);
    }) || [];
    
    const shuffledBooks = recommendedBooks.sort(() => 0.5 - Math.random());
    setRecommendations(shuffledBooks.slice(0, 4));
    setSelectedGenre(mostCommonGenre);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
  } finally {
    setIsGeneratingRecommendations(false);
  }
};

useEffect(() => {
  if (readBooks.length > 0) {
    fetchRecommendations();
  }
}, [readBooks, currentlyReading, dnfBooks]);

  return (
    <div className="homepage">
      {/* Currently Reading - Carusel */}
      <section className="section">
  <h2>Currently Reading</h2>
  <div className="streak-banner">
  🔥 Reading Streak: {currentStreak} days
</div>
  <div className="reading-streak">
    {Object.keys(streakDays).map(day => (
      <div 
        key={day} 
        className={`day-icon ${streakDays[day] ? 'active' : ''}`}
        onClick={() => handleDayClick(day)}
      >
        {day[0]}
      </div>
    ))}
  </div>
  <div className="carousel-container" ref={carouselContainerRef}>
    <button 
      className="carousel-arrow left" 
      onClick={handlePrev}
      disabled={currentSlide === 0}
    >
      ‹
    </button>
    
    <div className="carousel">
      <div 
        className="carousel-track" 
        ref={carouselTrackRef}
        style={{
          transform: `translateX(-${currentSlide * 100}%)`
        }}
      >
        {/* FIXED: Use event delegation to ensure correct book selection */}
        {currentlyReading.map((book, index) => (
          <div 
            key={`book-${book.id}-${index}`} // More unique key
            className="book-item" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("=== CLICK DEBUG ===");
              console.log("Clicked book index:", index);
              console.log("Clicked book object:", book);
              console.log("Book ID from object:", book.id);
              console.log("Book title:", book.title);
              console.log("==================");
              handleBookSelect(book);
            }}
            data-book-id={book.id}
            data-book-index={index}
            data-book-title={book.title}
          >
            <img 
              src={covers[book.google_books_id] || "default-cover.jpg"} 
              alt={book.title} 
            />
            <p>{book.title}</p>
            {book.pages && (
      <div className="book-progress">
        {Math.round(((book.page_counter || 0) / book.pages) * 100)}%
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{
              width: `${Math.min(100, ((book.page_counter || 0) / book.pages) * 100)}%`
            }}
          ></div>
        </div>
      </div>
    )}
          </div>
        ))}
    </div>

    <button 
      className="carousel-arrow right" 
      onClick={handleNext}
      disabled={currentSlide === Math.ceil(currentlyReading.length / 4) - 1}
    >
      ›
    </button>
  </div>
  </div>
  {/* Adăugăm secțiunea de progres */}
  {selectedBook && (
  <div className="reading-progress">
     <h3>
      Update Progress: {selectedBook.page_counter || 0}/
      {selectedBook.pages || 'N/A'} pages
    </h3>
    <input
      type="number"
      className="progress-input"
      placeholder="Pages read today"
      value={pagesRead}
      onChange={(e) => setPagesRead(e.target.value)}
      min="0"
      max={selectedBook.pages ? selectedBook.pages - (selectedBook.page_counter || 0) : undefined}
    />
    <div className="progress-buttons">
      <button onClick={handleMarkToday}>
        I have read today
      </button>
      <button onClick={handleFinishBook}>
        Mark as finished
      </button>
      <button className="dnf-button" onClick={handleDNFBook}>DNF</button>
    </div>
  </div>
)}
</section>

      {/* Read & Want to Read */}
      <section>
        <div className="books-sections">
          <div className="read-section">
        <h2>Read</h2>
        <div className="book-list">
          {readBooks.slice(0, 4).map((book) => (
            <div key={book.id} className="book-item" onClick={() => handleBookClick(book.google_books_id)}>
              <img src={covers[book.google_books_id] || "default-cover.jpg"} alt={book.title} />
              <p>{book.title}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/read")}>Load More</button>
        </div>

      <div className="want-to-read-section">
        <h2>Want to Read</h2>
        <div className="book-list">
          {wantToRead.slice(0, 4).map((book) => (
            <div key={book.id} className="book-item" onClick={() => handleBookClick(book.google_books_id)}>
              <img src={covers[book.google_books_id] || "default-cover.jpg"} alt={book.title} />
              <p>{book.title}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/want_to_read")}>Load More</button>
        </div>
        </div>
      </section>

      <section>
      <div className="books-sections">
        <div className="dnf-section">
        <h2>Did Not Finish (DNF)</h2>
        <div className="book-list">
          {dnfBooks.slice(0, 4).map((book) => (
            <div key={book.id} className="book-item" onClick={() => handleBookClick(book.google_books_id)}>
              <img src={covers[book.google_books_id] || "default-cover.jpg"} alt={book.title} />
              <p>{book.title}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/dnf")}>Load More</button>
        </div>
        
       <div className="recommandations-section">
  <h2>Recommendations</h2>
  <div style={{ marginBottom: '15px' }}>
    <p>Based on your favorite genre: <strong>{selectedGenre}</strong></p>
    <button 
      onClick={fetchRecommendations}
      disabled={isGeneratingRecommendations}
      style={{
        background: '#3498db',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {isGeneratingRecommendations ? 'Generating...' : 'Refresh Recommendations'}
    </button>
  </div>
 <div className="book-list">
  {recommendations.length > 0 ? (
    recommendations.map((book) => (
      <div key={book.id} className="book-item" onClick={() => handleBookClick(book.id)}>
        <img 
          src={book.volumeInfo.imageLinks?.thumbnail || "default-cover.jpg"} 
          alt={book.volumeInfo.title} 
        />
        <p>{book.volumeInfo.title}</p>
      </div>
    ))
  ) : (
    <div className="no-recommendations">
      <p>No new recommendations found.</p>
      <p>Try refreshing or read more books to get better suggestions!</p>
    </div>
  )}
</div>
</div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;