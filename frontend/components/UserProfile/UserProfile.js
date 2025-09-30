import './UserProfile.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUser } from "react-icons/fa";

const UserProfile = () => {
    const [covers, setCovers] = useState({});
    const [wantToRead, setWantToRead] = useState([]);
    const [recentUpdates, setRecentUpdates] = useState([]);
    const [user, setUser] = useState(null);
    const [currentlyReading, setCurrentlyReading] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [favoriteGenre, setFavoriteGenre] = useState('');
    const [friendsUpdates, setFriendsUpdates] = useState([]);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const navigate = useNavigate();
    const { userId: urlUserId } = useParams(); // Get userId from URL params

    const handleBookClick = (bookId) => {
        navigate(`/book/${bookId}`);
    };

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

    // Determine which user profile to show
    const getProfileUserId = () => {
        const currentUserId = getCurrentUserId();
        
        // If we have a userId in URL params, use that (friend's profile)
        if (urlUserId) {
            setIsOwnProfile(parseInt(urlUserId) === parseInt(currentUserId));
            return parseInt(urlUserId);
        }
        
        // Otherwise, show current user's profile
        setIsOwnProfile(true);
        return currentUserId;
    };

    useEffect(() => {
        const fetchFriendsUpdates = async () => {
            try {
                const currentUserId = getCurrentUserId();
                if (!currentUserId || !isOwnProfile) return; // Only show for own profile

                const response = await axios.get(`http://localhost:3001/api/friendships/${currentUserId}/updates`);
                setFriendsUpdates(response.data);
                console.log("response:", response.data);
            } catch (error) {
                console.error("Error fetching friends updates:", error);
            }
        };

        if (isOwnProfile) {
            fetchFriendsUpdates();
        }
    }, [isOwnProfile]);

    console.log("friends updates: ", friendsUpdates);

    const handleFriendsClick = () => {
        const currentUserId = getCurrentUserId();
        if (currentUserId && isOwnProfile) {
            navigate(`/friendsList/${currentUserId}`);
        }
    };

    const handleAchievementsClick = () => {
        const currentUserId = getCurrentUserId();
        console.log("achievements user id:", currentUserId);
        if (currentUserId && isOwnProfile) {
            navigate(`/achievements/${currentUserId}`);
        }
    };

    const calculateAverageReadingTime = (readBooks) => {
        if (readBooks.length === 0) return null;

        let totalMinutes = 0;
        
        readBooks.forEach(book => {
            if (book.currently_reading_start_date && book.read_finish_date) {
                const startDate = new Date(book.currently_reading_start_date);
                const finishDate = new Date(book.read_finish_date);
                const diffInMs = finishDate - startDate;
                const diffInMinutes = Math.round(diffInMs / (1000 * 60));
                totalMinutes += diffInMinutes;
            }
        });

        const averageMinutes = totalMinutes / readBooks.length;
        const hours = Math.floor(averageMinutes / 60);
        const minutes = Math.round(averageMinutes % 60);

        return { hours, minutes };
    };

    useEffect(() => {
        const profileUserId = getProfileUserId();
        
        if (!profileUserId) {
            setError('User not found');
            setLoading(false);
            return;
        }

        console.log('Profile User ID:', profileUserId);
        console.log('Is Own Profile:', isOwnProfile);

        const fetchData = async () => {
            try {
                // Fetch user data for the profile being viewed
                const userResponse = await axios.get(`http://localhost:3001/api/users/${profileUserId}`);
                setUser(userResponse.data);

                // Fetch reading statuses for the profile being viewed
                const statusResponse = await axios.get(`http://localhost:3001/api/readingstatuses/user/${profileUserId}`);
                const books = Array.isArray(statusResponse.data) ? statusResponse.data : [statusResponse.data];

                // Process books
                const currently = books.filter(b => b.status === "currently_reading");
                const wantToRead = books.filter(b => b.status === "want_to_read");
                const readBooks = books.filter(b => b.status === "read");

                const avgPages = readBooks.length > 0 
                    ? Math.round(readBooks.reduce((sum, book) => sum + (book.pages || 0), 0) / readBooks.length)
                    : 0;

                const avgReadingTime = calculateAverageReadingTime(readBooks);

                const updates = books
                    .filter(b => b.updatedAt)
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .slice(0, 10);

                setCurrentlyReading(currently);
                setWantToRead(wantToRead);
                setRecentUpdates(updates);

                setUser(prev => ({
                    ...prev,
                    stats: {
                        ...prev?.stats,
                        avgPages: avgPages,
                        avgReadingTime: avgReadingTime
                    }
                }));

                // Fetch covers
                const bookIds = books.map(b => b.google_books_id).filter(id => id);
                const uniqueIds = [...new Set(bookIds)];
                const genreCounts = {};
                const coversData = await Promise.allSettled(
                    uniqueIds.map(id => 
                        axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`)
                    )
                );

                const newCovers = {};
                coversData.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        const bookData = result.value.data;
                        newCovers[uniqueIds[index]] = 
                            bookData.volumeInfo?.imageLinks?.thumbnail || '';
                            
                        // Add genres to counter
                        if (bookData.volumeInfo?.categories) {
                            bookData.volumeInfo.categories.forEach(genre => {
                                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                            });
                        }
                    }
                });

                let maxCount = 0;
                let topGenre = '';
                Object.entries(genreCounts).forEach(([genre, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        topGenre = genre;
                    }
                });

                setFavoriteGenre(topGenre);                
                setCovers(newCovers);

            } catch (err) {
                setError('Error loading data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [urlUserId]); // Re-run when URL userId changes

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!user) return <div className="error">User not found</div>;

    return (
            <div className="profile-container">
                <div className="profile-header">
                    <div className="user-avatar">
                        <FaUser className="user-icon" />
                    </div>
                    <div className="user-info">
                        <h2 className="username">{user.username}</h2>
                        {isOwnProfile && (
                            <p className="friends-count" onClick={handleFriendsClick}>Friends</p>
                        )}
                        {isOwnProfile && (
                            <p className="friends-count" onClick={handleAchievementsClick}>Achievements</p>
                        )}
                    </div>
                </div>

                {/* Currently Reading Section */}
                <div className="first-row">
                    <section className="currently-reading">
                        <h2>{isOwnProfile ? 'Currently reading books' : `${user.username}'s currently reading books`}</h2>
                        <div className="books-grid">
                            {currentlyReading.slice(0, 4).map(book => (
                                <div 
                                    key={book.id} 
                                    className="book-card"
                                    onClick={() => handleBookClick(book.google_books_id)}
                                >
                                    <img 
                                        src={covers[book.google_books_id] || '/default-cover.jpg'} 
                                        alt={book.title}
                                    />
                                    <div className="title-container">
                                        <h3>{book.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <a href="/currently-reading" className="view-all">View all →</a>
                    </section>

                    {/* Statistics Section */}
                    <aside className="reading-stats">
                        <h2>Statistics</h2>
                        <p>The books that {isOwnProfile ? 'I' : user.username} read have on average {user.stats?.avgPages || 0} pages</p>
                        <p>{isOwnProfile ? 'My' : `${user.username}'s`} favorite genres are: {favoriteGenre || 'No data'}</p>
                    </aside>
                </div>

                {/* Recent Updates Section */}
                <section className="recent-updates">
                    <h2>{isOwnProfile ? 'My recent updates' : `${user.username}'s recent updates`}</h2>
                    <div className="updates-list">
                        {recentUpdates.map(update => (
                            <div 
                                key={update.id} 
                                className="update-item"
                                onClick={() => handleBookClick(update.google_books_id)} 
                            >
                                <div className="update-content">
                                    <img 
                                        src={covers[update.google_books_id] || '/default-cover.jpg'} 
                                        alt={update.title}
                                    />
                                    <div>
                                        <h3>{update.title}</h3>
                                        <p className='update-meta'>Updated at: {new Date(update.updatedAt).toLocaleDateString()}</p>
                                        <span className="update-status">Book status: {update.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Friends Updates Section - Only show for own profile */}
                {isOwnProfile && (
                    <section className="friends-updates">
                        <h2>Friends' Last Updates</h2>
                        {friendsUpdates.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                No recent updates from friends
                            </p>
                        ) : (
                            <div className="updates-list">
                                {friendsUpdates.map(update => (
                                    <div 
                                        key={`${update.userId}-${update.bookId}`} 
                                        className="friend-update-item"
                                        onClick={() => handleBookClick(update.google_books_id)}
                                    >
                                        <img 
                                            src={covers[update.google_books_id] || '/default-cover.jpg'} 
                                            alt={update.title}
                                        />
                                        <div className="friend-update-content">
                                            <div className="friend-update-user">{update.username}</div>
                                            <div className="friend-update-title">{update.title}</div>
                                            <div className="friend-update-meta">
                                                <span>{new Date(update.updatedAt).toLocaleDateString()}</span>
                                                <span className="friend-update-status">
                                                    {update.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Want to Read Section */}
                <section className="want-to-read">
                    <h2>{isOwnProfile ? 'Want to read' : `${user.username} wants to read`}</h2>
                    <div className="books-grid">
                        {wantToRead.slice(0, 3).map(book => (
                            <div key={book.id} className="book-card">
                                <img 
                                    src={covers[book.google_books_id] || '/default-cover.jpg'} 
                                    alt={book.title}
                                />
                                <h3>{book.title}</h3>
                            </div>
                        ))}
                    </div>
                    <a href="/want_to_read" className="view-all">View all →</a>
                </section>
            </div>
    );
}

export default UserProfile;