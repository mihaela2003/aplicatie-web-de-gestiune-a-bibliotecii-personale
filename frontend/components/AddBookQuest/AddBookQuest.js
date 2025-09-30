import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './AddBookQuest.css';

const AddBookQuest = () => {
  const { challengeId, questId } = useParams();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [questBooks, setQuestBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

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

  const userId = getCurrentUserId();

  useEffect(() => {
    fetchQuestBooks();
  }, [questId]);

  console.log("id quest:", questId);

  // Function to handle navigation to book details
  const handleBookCoverClick = (googleBooksId) => {
    navigate(`/book/${googleBooksId}`);
  };

  // Function to get Google Books cover image URL
  const getGoogleBooksCoverUrl = (googleBooksId, size = 'thumbnail') => {
    if (!googleBooksId) return null;
    
    // Google Books API cover URL format
    const sizeParam = size === 'small' ? 'smallThumbnail' : 'thumbnail';
    return `https://books.google.com/books/content?id=${googleBooksId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
  };

  // Function to remove duplicates and ensure unique keys
  const removeDuplicateBooks = (books) => {
    const uniqueBooks = [];
    const seenIds = new Set();
    
    books.forEach(book => {
      if (!seenIds.has(book.id)) {
        seenIds.add(book.id);
        uniqueBooks.push(book);
      }
    });
    
    return uniqueBooks;
  };

  // Function to check if a book is already added by the current user
  const isBookAddedByCurrentUser = (googleBooksId) => {
    // Check if any quest book has the same Google Books ID and was added by current user
    return questBooks.some(questBook => 
      questBook.Book && 
      questBook.Book.google_books_id === googleBooksId && 
      questBook.addedBy === userId
    );
  };

  // Function to get all Google Books IDs that current user has added
  const getCurrentUserBookIds = () => {
    return questBooks
      .filter(questBook => questBook.addedBy === userId && questBook.Book)
      .map(questBook => questBook.Book.google_books_id)
      .filter(id => id); // Remove any null/undefined IDs
  };

  // Function to filter search results to exclude books already added by current user
  const filterSearchResults = (books) => {
    const userBookIds = getCurrentUserBookIds();
    return books.filter(book => !userBookIds.includes(book.id));
  };

  // Function to filter quest books to exclude books added by current user
  const getOtherUsersBooks = () => {
    return questBooks.filter(questBook => questBook.addedBy !== userId);
  };

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchBooks(query);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms delay

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Handle search input change with real-time search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const fetchQuestBooks = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/questBook/${questId}/books`);
      if (response.ok) {
        const data = await response.json();
        setQuestBooks(data);
        console.log('Updated quest books:', data); // Debug log
      } else {
        console.error('Failed to fetch quest books:', response.status, response.statusText);
        // If there's an error, set empty array to prevent crashes
        setQuestBooks([]);
      }
    } catch (error) {
      console.error('Error fetching quest books:', error);
      // Set empty array to prevent crashes
      setQuestBooks([]);
    }
  };

  const searchBooks = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/books/search?q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search books');
      }
      
      const data = await response.json();
      
      // Remove duplicates before filtering
      const uniqueBooks = removeDuplicateBooks(data.items || []);
      
      // Filter out books already added by current user
      const filteredBooks = filterSearchResults(uniqueBooks);
      
      setSearchResults(filteredBooks);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  const addBookToQuest = async (book) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Default status - no user selection needed
      const defaultStatus = 'want to read';
      
      setLoading(true);
      setError(null);

      // Step 1: Check if book exists in our database by Google Books ID
      let bookId;
      const checkResponse = await fetch(
        `http://localhost:3001/api/books/google/${book.id}`
      );
      
      if (checkResponse.ok) {
        // Book exists in database
        const existingBook = await checkResponse.json();
        bookId = existingBook.book.id;
        console.log('Book found in database:', existingBook.book);
      } else if (checkResponse.status === 404) {
        // Book doesn't exist, create it
        console.log('Book not found in database, creating new book...');
        
        const bookData = {
          title: book.volumeInfo.title || 'Unknown Title',
          authors: book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown Author',
          description: book.volumeInfo.description || '',
          cover_image: book.volumeInfo.imageLinks?.thumbnail || '',
          google_books_id: book.id
        };

        const createResponse = await fetch('http://localhost:3001/api/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookData)
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.message || 'Failed to create book in database');
        }

        const createdBook = await createResponse.json();
        bookId = createdBook.id;
        console.log('New book created with ID:', bookId);
      } else {
        throw new Error('Error checking if book exists in database');
      }

      // Step 2: Add book to quest with the default status
      const addResponse = await fetch(
        `http://localhost:3001/api/questBook/${questId}/books`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bookId: bookId,
            status: defaultStatus
          })
        }
      );

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        if (errorData.error && errorData.error.includes('already added')) {
          setError('This book is already added to the quest');
        } else {
          throw new Error(errorData.error || 'Failed to add book to quest');
        }
        return;
      }

      // Step 3: Success - refresh quest books first, then update search results
      console.log('Book successfully added to quest with status:', defaultStatus);
      await fetchQuestBooks(); // Wait for quest books to be updated
      
      // Re-run the search to update results (this will automatically filter out the newly added book)
      if (searchQuery.trim().length >= 2) {
        await searchBooks(searchQuery);
      }
      
      // Show success message
      setError(null);
      
    } catch (error) {
      console.error('Add book error:', error);
      setError(error.message || 'Failed to add book to quest');
    } finally {
      setLoading(false);
    }
  };

  // Function to add a book that was added by another user to current user's quest
  const addExistingBookToQuest = async (questBook) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Default status - no user selection needed
      const defaultStatus = 'want to read';
      
      setLoading(true);
      setError(null);

      // The book already exists in the database, so we just need to add it to the quest
      const addResponse = await fetch(
        `http://localhost:3001/api/questBook/${questId}/books`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bookId: questBook.Book.id,
            status: defaultStatus
          })
        }
      );

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        if (errorData.error && errorData.error.includes('already added')) {
          setError('This book is already added to your quest');
        } else {
          throw new Error(errorData.error || 'Failed to add book to quest');
        }
        return;
      }

      // Success - refresh quest books
      console.log('Book successfully added to quest with status:', defaultStatus);
      await fetchQuestBooks();
      
      // Show success message
      setError(null);
      
    } catch (error) {
      console.error('Add existing book error:', error);
      setError(error.message || 'Failed to add book to quest');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Get books added by other users
  const otherUsersBooks = getOtherUsersBooks();

  return (
      <div className="book-quest-container">
        <div className="book-quest-header">
          <button 
            className="book-quest-back-btn"
            onClick={() => navigate(`/challengedetails/${challengeId}`)}
          >
            ← Back to Challenge
          </button>
          <h2>Add Books to Quest</h2>
        </div>

        {/* Search Section */}
        <div className="book-quest-search-section">
          <div className="book-quest-search-bar">
            <input
              type="text"
              placeholder="Search for books (type at least 2 characters)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              className="book-quest-search-input"
            />
            <button 
              onClick={() => searchBooks()}
              disabled={loading || searchQuery.trim().length < 2}
              className="book-quest-search-btn"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error && <div className="book-quest-error">{error}</div>}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="book-quest-search-results">
              <h3>Search Results ({searchResults.length} found)</h3>
              <div className="book-quest-books-grid">
                {searchResults.map((book, index) => (
                  <div key={`${book.id}-${index}`} className="book-quest-book-card">
                    <div 
                      className="book-quest-book-cover clickable-cover"
                      onClick={() => handleBookCoverClick(book.id)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view book details"
                    >
                      {book.volumeInfo.imageLinks?.thumbnail ? (
                        <img 
                          src={book.volumeInfo.imageLinks.thumbnail} 
                          alt={book.volumeInfo.title}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="book-quest-no-cover">No Cover</div>
                      )}
                      <div className="book-quest-no-cover" style={{display: 'none'}}>
                        No Cover
                      </div>
                    </div>
                    <div className="book-quest-book-info">
                      <h4 
                        className="book-quest-book-title clickable-title"
                        onClick={() => handleBookCoverClick(book.id)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view book details"
                      >
                        {book.volumeInfo.title || 'Unknown Title'}
                      </h4>
                      <p className="book-quest-book-author">
                        {book.volumeInfo.authors ? 
                          book.volumeInfo.authors.join(', ') : 
                          'Unknown Author'
                        }
                      </p>
                    </div>
                    <button 
                      className="book-quest-add-btn"
                      onClick={() => addBookToQuest(book)}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
            <div className="book-quest-no-books">
              {getCurrentUserBookIds().length > 0 ? 
                `No new books found for "${searchQuery}". You may have already added all matching books.` :
                `No books found for "${searchQuery}". Try a different search term.`
              }
            </div>
          )}
        </div>

        <div className="book-quest-existing-books">
          <h3>Books Added by Other Users ({otherUsersBooks.length})</h3>
          {otherUsersBooks.length > 0 ? (
            <div className="book-quest-books-grid">
              {otherUsersBooks.map((questBook) => (
                <div key={questBook.id} className="book-quest-book-card book-quest-existing book-quest-compact">
                  <div 
                    className="book-quest-book-cover clickable-cover"
                    onClick={() => handleBookCoverClick(questBook.Book?.google_books_id)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view book details"
                  >
                    {questBook.Book?.google_books_id ? (
                      <img 
                        src={getGoogleBooksCoverUrl(questBook.Book.google_books_id)}
                        alt={questBook.Book.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="book-quest-no-cover">No Cover</div>
                    )}
                    <div className="book-quest-no-cover" style={{display: 'none'}}>
                      No Cover
                    </div>
                  </div>
                  <div className="book-quest-book-info">
                    <h4 
                      className="book-quest-book-title clickable-title"
                      onClick={() => handleBookCoverClick(questBook.Book?.google_books_id)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view book details"
                    >
                      {questBook.Book ? questBook.Book.title : 'Unknown Title'}
                    </h4>
                    <p className="book-quest-book-author">
                      {questBook.Book ? questBook.Book.authors : 'Unknown Author'}
                    </p>
                    <p className="book-quest-added-by">
                      Added by: {questBook.User?.username || 'Unknown'}
                    </p>
                  </div>
                  {/* Add button for books added by other users */}
                  {questBook.Book && !isBookAddedByCurrentUser(questBook.Book.google_books_id) && (
                    <button 
                      className="book-quest-add-btn"
                      onClick={() => addExistingBookToQuest(questBook)}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="book-quest-no-books">
              {questBooks.length > 0 ? 
                'No books have been added by other users yet. Only your own books are hidden from this view.' :
                'No books have been added to this quest yet.'
              }
            </p>
          )}
        </div>
      </div>
  );
};

export default AddBookQuest;