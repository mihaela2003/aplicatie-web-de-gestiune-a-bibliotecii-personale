import "./ReadingChallengeDetails.css";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {Link} from 'react-router-dom';

const ReadingChallengeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [creator, setCreator] = useState(null);
    const [quests, setQuests] = useState([]);
    const [questBooks, setQuestBooks] = useState({}); // Store books for each quest
    const [bookDetails, setBookDetails] = useState({}); // Store Google Books details
    const [readingStatuses, setReadingStatuses] = useState({}); // Store reading statuses by book_id
    const [userChallengeId, setUserChallengeId] = useState(null);
    const [questProgress, setQuestProgress] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isParticipant, setIsParticipant] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

            // Function to fetch quest progress for the user
      const fetchQuestProgress = async (userChallengeId) => {
        try {
          const token = localStorage.getItem('token');
          if (!token || !userChallengeId) {
            return {};
          }

          const response = await fetch(
            `http://localhost:3001/api/questProgress/${userChallengeId}/progress`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch quest progress');
          }

          const progressData = await response.json();
          console.log('Quest progress data:', progressData);
          
          // Convert array to object with questId as key for easy lookup
          const progressMap = {};
          progressData.forEach(progress => {
            progressMap[progress.questId] = progress;
          });
          
          setQuestProgress(progressMap);
          return progressMap;
        } catch (error) {
          console.error('Error fetching quest progress:', error);
          return {};
        }
      };

      // Function to fetch reading statuses for the user
      const fetchUserReadingStatuses = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token || !userId) {
            return {};
          }

          const response = await fetch(
            `http://localhost:3001/api/readingstatuses/user/${userId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch reading statuses');
          }

          const statusesData = await response.json();
          console.log('User reading statuses:', statusesData);
          
          // Convert array to object with book_id as key for easy lookup
          const statusesMap = {};
          statusesData.forEach(status => {
            statusesMap[status.book_id] = status;
          });
          
          setReadingStatuses(statusesMap);
          return statusesMap;
        } catch (error) {
          console.error('Error fetching reading statuses:', error);
          return {};
        }
      };

      // Function to fetch book details from Google Books API
      const fetchGoogleBookDetails = async (googleBooksId) => {
        try {
          const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${googleBooksId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch book details from Google Books');
          }
          const bookData = await response.json();
          
          return {
            id: bookData.id,
            title: bookData.volumeInfo?.title || 'Unknown Title',
            authors: bookData.volumeInfo?.authors?.join(', ') || 'Unknown Author',
            cover_image: bookData.volumeInfo?.imageLinks?.thumbnail || 
                        bookData.volumeInfo?.imageLinks?.smallThumbnail || null,
            description: bookData.volumeInfo?.description || 'No description available'
          };
        } catch (error) {
          console.error('Error fetching Google Books details:', error);
          return null;
        }
      };

      // Function to fetch user's books for a specific quest
      const fetchUserBooksForQuest = async (questId) => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.log('No token found');
            return [];
          }

          // Send token in Authorization header and userId as query parameter
          const response = await fetch(
            `http://localhost:3001/api/questBook/${questId}/books?userId=${userId}`, 
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch quest books');
          }
          
          const questBooksData = await response.json();
          console.log(`Quest ${questId} books:`, questBooksData);
          
          // The backend should now filter by user, but let's double-check
          const userBooks = questBooksData.filter(questBook => 
            questBook.addedBy === userId
          );
          
          // Fetch Google Books details for each book
          const booksWithDetails = await Promise.all(
            userBooks.map(async (questBook) => {
              if (questBook.Book && questBook.Book.google_books_id) {
                // Check if we already have the details cached
                if (bookDetails[questBook.Book.google_books_id]) {
                  return {
                    ...questBook,
                    googleBookDetails: bookDetails[questBook.Book.google_books_id]
                  };
                }
                
                // Fetch from Google Books API
                const googleDetails = await fetchGoogleBookDetails(questBook.Book.google_books_id);
                
                // Cache the details
                setBookDetails(prev => ({
                  ...prev,
                  [questBook.Book.google_books_id]: googleDetails
                }));
                
                return {
                  ...questBook,
                  googleBookDetails: googleDetails
                };
              }
              return questBook;
            })
          );
          
          return booksWithDetails;
        } catch (error) {
          console.error('Error fetching user books for quest:', error);
          return [];
        }
      };

      // Function to fetch user books for all quests
      const fetchUserBooksForAllQuests = async (questsList) => {
        const booksData = {};
        
        for (const quest of questsList) {
          const userBooks = await fetchUserBooksForQuest(quest.id);
          booksData[quest.id] = userBooks;
        }
        
        setQuestBooks(booksData);
      };

      // Add this function after the other fetch functions
const fetchUserChallengeId = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token || !userId) return null;

    const response = await fetch(
      `http://localhost:3001/api/userChallenge/user/${userId}/challenge/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user challenge');
    }

    const userChallengeData = await response.json();
    setUserChallengeId(userChallengeData.id);
    return userChallengeData.id;
  } catch (error) {
    console.error('Error fetching user challenge ID:', error);
    return null;
  }
};

      useEffect(() => {
        const fetchChallengeDetails = async () => {
          try {
    
            // Fetch challenge details
            const challengeResponse = await fetch(`http://localhost:3001/api/readingChallenge/${id}?userId=${userId}`);
    
            if (!challengeResponse.ok) {
              throw new Error('Failed to fetch challenge details');
            }
    
            const challengeData = await challengeResponse.json();
            setChallenge(challengeData);
            setCreator(challengeData.Creator);
    
            // Fetch quests for this challenge
            const questsResponse = await fetch(`http://localhost:3001/api/challengeQuest/${id}/quests`);
            if (!questsResponse.ok) {
                throw new Error('Failed to fetch quests');
              }
      
              const questsData = await questsResponse.json();
              setQuests(questsData.quests);
      
              // Check if current user is a participant
              if (userId) {
                const participantResponse = await fetch(
                        `http://localhost:3001/api/readingChallenge/check/${userId}/${id}`,
                        {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
      
                if (participantResponse.ok) {
                  const participantData = await participantResponse.json();
                  setIsParticipant(participantData.isParticipant);
                  
                  // If user is participant, fetch their books for all quests AND reading statuses
                  if (participantData.isParticipant) {
                    console.log('User is participant, fetching books for quests:', questsData.quests);
                    await fetchUserBooksForAllQuests(questsData.quests);
                    await fetchUserReadingStatuses();
                    await fetchUserChallengeId();

                    const userChallengeId = await fetchUserChallengeId();
                    if(userChallengeId){
                      await fetchQuestProgress(userChallengeId);
                    }
                  }
                }
              }
      
            } catch (err) {
              console.error('Fetch error:', err);
              setError(err.message);
            } finally {
              setLoading(false);
            }
          };
      
          fetchChallengeDetails();
        }, [id, userId]);

      const handleJoinChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fixed URL to match the route pattern /:challengeId/join
      const response = await fetch(
        `http://localhost:3001/api/userChallenge/${id}/join`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to join challenge');
      }

      setIsParticipant(true);
      // Fetch user books for all quests after joining
      await fetchUserBooksForAllQuests(quests);
      // Fetch reading statuses
      await fetchUserReadingStatuses();
    } catch (err) {
      console.error('Join error:', err);
      setError(err.message);
    }
  };

          const handleDeleteChallenge = async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                navigate('/login');
                return;
              }

              const response = await fetch(
                `http://localhost:3001/api/readingChallenge/${id}?userId=${userId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (!response.ok) {
                throw new Error('Failed to delete challenge');
              }

              // Navigate back to challenges list or home page
              navigate('/readingchallenges'); // Adjust this path based on your routing
            } catch (err) {
              console.error('Delete error:', err);
              setError(err.message);
            }
          };

          const confirmDelete = () => {
            setShowDeleteConfirm(true);
          };

          const cancelDelete = () => {
            setShowDeleteConfirm(false);
          };

          const handleAddBookToQuest = async (questId) => {
            navigate(`/addBookQuest/${id}/${questId}`);
          };

          // Function to refresh user books for a quest (useful after adding books)
          const refreshUserBooksForQuest = async (questId) => {
            const userBooks = await fetchUserBooksForQuest(questId);
            setQuestBooks(prev => ({
              ...prev,
              [questId]: userBooks
            }));
          };

          // Helper function to get book display data
          const getBookDisplayData = (questBook) => {
            // Priority: Google Books details > Local Book data > Default values
            if (questBook.googleBookDetails) {
              return {
                title: questBook.googleBookDetails.title,
                authors: questBook.googleBookDetails.authors,
                cover_image: questBook.googleBookDetails.cover_image
              };
            } else if (questBook.Book) {
              return {
                title: questBook.Book.title || 'Unknown Title',
                authors: questBook.Book.authors || 'Unknown Author',
                cover_image: questBook.Book.cover_image
              };
            } else {
              return {
                title: 'Unknown Title',
                authors: 'Unknown Author',
                cover_image: null
              };
            }
          };

          // Helper function to get reading status for a book
          const getReadingStatusForBook = (questBook) => {
            if (!questBook.Book || !questBook.Book.id) {
              return 'No status';
            }
            
            const bookId = questBook.Book.id;
            const readingStatus = readingStatuses[bookId];
            
            if (!readingStatus) {
              return 'Not started';
            }
            
            // Transform status to display format
            switch (readingStatus.status) {
              case 'want_to_read':
                return 'Want to read';
              case 'currently_reading':
                return 'Currently reading';
              case 'read':
                return 'Read';
              default:
                return readingStatus.status || 'No status';
            }
          };

          // Helper function to get status color class
          const getStatusColorClass = (status) => {
            switch (status) {
              case 'Want to read':
                return 'status-want-to-read';
              case 'Currently reading':
                return 'status-currently-reading';
              case 'Read':
                return 'status-read';
              default:
                return 'status-default';
            }
          };

          // Function to get quest progress display
          const getQuestProgressDisplay = (questId) => {
            const progress = questProgress[questId];
            const quest = quests.find(q => q.id === questId);
            
            if (!progress || !quest) {
              return { current: 0, target: quest?.targetCount || 1 };
            }
            
            return {
              current: progress.progressCount || 0,
              target: quest.targetCount || 1,
              completed: progress.completed || false
            };
          };

          if (loading) {
            return <div className="main-content">Loading challenge details...</div>;
          }
        
          if (error) {
            return <div className="main-content">Error: {error}</div>;
          }
        
          if (!challenge) {
            return <div className="main-content">Challenge not found</div>;
          }

          console.log("quest books", questBooks);
          console.log("reading statuses", readingStatuses);

         return (
              <div className="challenge-details-container">
                <div className="challenge-header">
                  <h2>{challenge.title}</h2>
                  <div className="challenge-meta">
                    {challenge.startDate && (
                      <span>Starts: {new Date(challenge.startDate).toLocaleDateString()}</span>
                    )}
                    {challenge.endDate && (
                      <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                    )}
                    <span>{challenge.isPublic ? 'Public' : 'Private'} challenge</span>
                  </div>
                  
                  <h3 className="challenge-description">{challenge.description}</h3>
                  
                  {!isParticipant && challenge.userId !== userId && (
                    <button 
                      className="btn-join"
                      onClick={handleJoinChallenge}
                    >
                      Join Challenge
                    </button>
                  )}

                  {challenge.userId === userId && (
                    <div className="challenge-actions">
                      <Link 
                        to={`/challengedetails/${id}/edit`}
                        className="btn-edit"
                      >
                        Edit Challenge
                      </Link>
                      
                      <button 
                        className="btn-delete-challenge"
                        onClick={confirmDelete}
                      >
                        Delete Challenge
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <h3>Confirm Delete</h3>
                      <p>Are you sure you want to delete this challenge? This action cannot be undone.</p>
                      <div className="modal-actions">
                        <button 
                          className="btn-confirm-delete"
                          onClick={handleDeleteChallenge}
                        >
                          Yes, Delete
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={cancelDelete}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="quests-section">
                <h2>Quests</h2>
          
                 {quests.length > 0 ? (
                 <div className="quests-list">
              {quests.map((quest) => {
                const progressDisplay = getQuestProgressDisplay(quest.id);
                
                return (
                <div key={quest.id} className="quest-card">
                  <div className="quest-content">
                    <h3>{quest.prompt}</h3>
                    <p>Type: {quest.type}</p>
                    {quest.targetCount > 1 && (
                      <p>Target: {quest.targetCount}</p>
                    )}
                    
                    {/* Show progress if user is participant */}
                    {isParticipant && (
                      <div className="quest-progress">
                        <progress 
                          value={progressDisplay.current} 
                          max={progressDisplay.target}
                          className={progressDisplay.completed ? 'quest-completed' : ''}
                        />
                        <span className={progressDisplay.completed ? 'progress-completed' : ''}>
                          {progressDisplay.current} / {progressDisplay.target}
                          {progressDisplay.completed && ' ✓'}
                        </span>
                      </div>
                    )}

                    {/* Show user's books for this quest */}
                    {isParticipant && questBooks[quest.id] && questBooks[quest.id].length > 0 && (
                      <div className="user-quest-books">
                        <h4>Your Books for This Quest:</h4>
                        <div className="user-books-list">
                          {questBooks[quest.id].map((questBook) => {
                            const bookData = getBookDisplayData(questBook);
                            const readingStatus = getReadingStatusForBook(questBook);
                            const statusColorClass = getStatusColorClass(readingStatus);
                            
                            return (
                             <div key={questBook.id} className="user-book-item">
                                <Link 
                                  to={`/book/${questBook.Book?.google_books_id || questBook.googleBookDetails?.id}`}
                                  className="user-book-cover-link"
                                >
                                  <div className="user-book-cover">
                                    {bookData.cover_image ? (
                                      <img 
                                        src={bookData.cover_image} 
                                        alt={bookData.title}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : (
                                      <div className="user-book-no-cover">No Cover</div>
                                    )}
                                    <div className="user-book-no-cover" style={{display: bookData.cover_image ? 'none' : 'flex'}}>
                                      No Cover
                                    </div>
                                  </div>
                                </Link>
                                <div className="user-book-info">
                                  <h5 className="user-book-title">
                                    {bookData.title}
                                  </h5>
                                  <p className="user-book-author">
                                    {bookData.authors}
                                  </p>
                                  <span 
                                    className={`user-book-status ${statusColorClass}`}
                                    data-status={readingStatus}
                                  >
                                    {readingStatus}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Add Book Button - only show if user is participant */}
                  {isParticipant && (
                    <button 
                      className="btn-add-book-quest"
                      onClick={() => handleAddBookToQuest(quest.id)}
                      title="Add Book to Quest"
                    >
                      +
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            <p>This challenge doesn't have any quests yet.</p>
          )}
        </div>
        </div>
  );
};
export default ReadingChallengeDetails;