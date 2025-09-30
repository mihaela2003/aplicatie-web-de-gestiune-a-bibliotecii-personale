import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { FaSearch, FaUser } from "react-icons/fa";
import { IoIosMoon } from "react-icons/io";
import axios from "axios"

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const profileIconRef = useRef(null);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSignOut = () => {
    navigate("/login");
  };


 const searchBooks = async (searchQuery) => {
  if (searchQuery.length < 2) {
    setBooks([]); 
    return;
  }

  try {
    const response = await axios.get(`http://localhost:3001/api/books/search?q=${searchQuery}`);
    setBooks(response.data.items || []);
  } catch (error) {
    console.error("Eroare la căutare:", error);
  }
};

// Debounce: Așteaptă 500ms după ce utilizatorul încetează să tasteze
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (query.trim()) {
      searchBooks(query);
    }
  }, 500);

  return () => clearTimeout(timeoutId); // Șterge timeout-ul dacă query-ul se schimbă rapid
}, [query]);

const handleBookClick = (bookId) => {
  navigate(`/book/${bookId}`);  // Navigăm la pagina detaliilor cărții
  setBooks([]);  // Ascundem dropdown-ul de căutare
  setQuery("");  // Resetăm input-ul de căutare
};

  useEffect(() => {
    let timeoutId;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
            profileIconRef.current && !profileIconRef.current.contains(event.target)){
              setShowDropdown(false);
            }
    };

    if(showDropdown){
      timeoutId = setTimeout(() => {
        setShowDropdown(false);
      }, 10000);

      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <nav className="navbar">
      {/* Buton pentru pagina principală */}
      <div className="nav-left" onClick={() => navigate("/homepage")}> 
        <IoIosMoon className="moon-icon" />
      </div>
      
      {/* Butoane pentru statistici și Reading Challenges */}
      <div className="nav-center">
        <button onClick={() => navigate("/statistics")}>Statistics</button>
        <button onClick={() => navigate("/readingchallenges")}>Reading Challenges</button>
        <button onClick={() => navigate("/mylibrary")}>My Library</button>
      </div>
      
       {/* Căutare */}
       <div className="nav-search">
        <input
          type="text"
          placeholder="Search books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <FaSearch className="search-icon" onClick={searchBooks} />

         {/* Dropdown cu rezultate */}
        {books.length > 0 && (
          <div className="search-results">
            {books.map((book, index) => {
              const title = book.volumeInfo?.title || "Carte fără titlu";
              const thumbnail = book.volumeInfo?.imageLinks?.thumbnail || "../public/default-cover.png"; // Placeholder dacă nu are copertă
              const bookId = book.id; // ID-ul unic al cărții

              return (
                <div key={index} className="search-item" onClick={() => handleBookClick(bookId)}>
                  <img src={thumbnail} alt={title} className="book-thumbnail" />
                  <span>{title}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Profil */}
      <div className="nav-profile">
        <FaUser className="profile-icon" onClick={toggleDropdown} ref={profileIconRef}/>
        {showDropdown && (
          <div className="dropdown-menu" ref={dropdownRef}>
            <button onClick={() => navigate("/userprofile")}>Profile</button>
            <button onClick={() => navigate("/notification")}>Notifications</button>
            <button onClick={() => navigate("/manageaccount")}>Manage Account</button>
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
