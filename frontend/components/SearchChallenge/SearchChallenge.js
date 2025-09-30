import React, { useState, useEffect } from 'react';
import './SearchChallenge.css';
import { useNavigate } from "react-router-dom";
import {jwtDecode} from 'jwt-decode';

const SearchChallenge = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [publicChallenges, setPublicChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get current user ID from token
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

  const currentUserId = getCurrentUserId();

  // Fetch public challenges and user challenges on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token || !currentUserId) {
          throw new Error('Authentication required');
        }
        
        // Fetch public challenges - corrected endpoint
        const publicResponse = await fetch('http://localhost:3001/api/readingChallenge/public', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!publicResponse.ok) throw new Error('Failed to fetch public challenges');
        const publicData = await publicResponse.json();
        
        // Fetch user challenges to filter out joined ones - corrected endpoint
        const userResponse = await fetch(`http://localhost:3001/api/readingChallenge/user/${currentUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!userResponse.ok) throw new Error('Failed to fetch user challenges');
        const userData = await userResponse.json();
        
        setPublicChallenges(publicData);
        setUserChallenges([...userData.created, ...userData.participating]);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchData();
    } else {
      setError('User not authenticated');
      setLoading(false);
    }
  }, [currentUserId]);

  // Filter challenges based on search term and user participation
  useEffect(() => {
    if (!publicChallenges.length) return;

    // Get IDs of challenges user has already joined or created
    const joinedChallengeIds = userChallenges.map(challenge => challenge.id);
    
    // Filter out challenges user has already joined
    const availableChallenges = publicChallenges.filter(
      challenge => !joinedChallengeIds.includes(challenge.id)
    );

    // Apply search filter if search term has at least 2 characters
    if (searchTerm.length >= 2) {
      const filtered = availableChallenges.filter(challenge =>
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (challenge.description && challenge.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredChallenges(filtered);
    } else {
      setFilteredChallenges(availableChallenges);
    }
  }, [searchTerm, publicChallenges, userChallenges]);


  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="search-challenge-container">
          <div className="search-challenge-loading">Loading challenges...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="search-challenge-container">
          <div className="search-challenge-error">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="search-challenge-container">
        <div className="search-challenge-header">
          <h2 className="search-challenge-title">Discover Reading Challenges</h2>
          
          {/* Search Bar */}
          <div className="search-challenge-search-container">
            <input
              type="text"
              className="search-challenge-search-input"
              placeholder="Search challenges... (min 2 characters)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="search-challenge-search-icon">🔍</div>
          </div>
          
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <div className="search-challenge-search-hint">
              Type at least 2 characters to search
            </div>
          )}
        </div>

        {/* Results */}
        <div className="search-challenge-results">
          {filteredChallenges.length === 0 ? (
            <div className="search-challenge-no-results">
              {searchTerm.length >= 2 
                ? `No challenges found matching "${searchTerm}"`
                : "No new challenges available to join"
              }
            </div>
          ) : (
            <div className="search-challenge-grid">
              {filteredChallenges.map(challenge => (
                <div key={challenge.id} className="search-challenge-card">
                  <div className="search-challenge-card-header">
                    <h3 className="search-challenge-card-title">{challenge.title}</h3>
                    <div className="search-challenge-card-creator">
                      by {challenge.Creator?.username || challenge.User?.username || 'Unknown'}
                    </div>
                  </div>
                  
                  {challenge.description && (
                    <p className="search-challenge-card-description">
                      {challenge.description}
                    </p>
                  )}
                  
                  <div className="search-challenge-card-dates">
                    <div className="search-challenge-card-date">
                      <strong>Start:</strong> {formatDate(challenge.startDate)}
                    </div>
                    <div className="search-challenge-card-date">
                      <strong>End:</strong> {formatDate(challenge.endDate)}
                    </div>
                  </div>
                  
                  <div className="search-challenge-card-participants">
                    {challenge.UserChallenges?.length || 0} participants
                  </div>
                  
                  <button
                    className="search-challenge-join-button"
                    onClick={() => navigate(`/challengedetails/${challenge.id}`)}
                  >
                    View Challenge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchChallenge;