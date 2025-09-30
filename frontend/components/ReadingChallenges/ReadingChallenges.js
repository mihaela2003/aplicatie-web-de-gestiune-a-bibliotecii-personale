import React, { useState, useEffect } from 'react';
import './ReadingChallenges.css';
import { useNavigate } from "react-router-dom";
import {jwtDecode} from 'jwt-decode';


const ReadingChallenges = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    const fetchChallenges = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`http://localhost:3001/api/readingChallenge/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch challenges');
        }
        
        const data = await response.json();
        console.log('Challenges data:', data); // Debug
        
        const allChallenges = [
          ...(data.created || []),
          ...(data.participating || [])
        ];
        const uniqueChallenges = allChallenges
          .filter((challenge, index, self) => 
            index === self.findIndex(c => c.id === challenge.id)
          ).map(challenge => ({
          id: challenge.id,
          title: challenge.title,
          target: challenge.questTarget || 0,
          completed: challenge.completedQuests || 0,
          color: "#4a6fa5"
        }));

        console.log("unique challenges:", uniqueChallenges);
        
        setChallenges(uniqueChallenges);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  if (loading) {
    return <div className="main-content">Loading challenges...</div>;
  }

  if (error) {
    return <div className="main-content">Error: {error}</div>;
  }

  return (
      <div className="reading-challenges-container">
        <div className="challenges-header">
          <h2>Your reading challenges</h2>
          <div className="header-controls">
              <button className="btn-create"
              onClick={() => navigate("/readingchallenges/searchChallenge")}>
                🔍 Search
              </button>
            <button 
              className="btn-create" 
              onClick={() => navigate("/readingchallenges/challengeform")}
            >
              Create New Challenge
            </button>
          </div>
        </div>
        <div className="challenge-cards-container">
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={{
                  id: challenge.id,
                  title: challenge.title,
                  target: challenge.target || 0, 
                  completed: challenge.completed || 0, 
                  color: "#4a6fa5" 
                }}
                navigate={navigate}
              />
            ))
          ) : (
            <p>No challenges found. Create your first challenge!</p>
          )}
        </div>
      </div>
  );
};

const ChallengeCard = ({ challenge, navigate }) => {
  const progress = Math.min((challenge.completed / challenge.target) * 100, 100);

  return (
    <div className="challenge-card">
      <h2>{challenge.title}</h2>
      <div className="progress-bar-challenge">
        <div
          className="progress"
          style={{
            width: `${progress}%`,
            backgroundColor: challenge.color,
          }}
        ></div>
      </div>
      <p>
        {challenge.completed}/{challenge.target} quests completed
      </p>
      <button 
        className="btn-view-details" 
        onClick={() => navigate(`/challengedetails/${challenge.id}`)}
      >
        View Details
      </button>
    </div>
  );
};

export default ReadingChallenges;