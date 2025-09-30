import React, { useState, useEffect } from "react";
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import "./Notifications.css";

const Notifications = () => {
    const [friendRequests, setFriendRequests] = useState([]);
    const [challengeInvites, setChallengeInvites] = useState([]);

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
      
      const currentUserId = getCurrentUserId(); 

    useEffect(() => {
        const fetchFriendRequests = async () => {
            try {
                console.log('DEBUG: currentUserId:', currentUserId);
                console.log('DEBUG: Making request to:', `http://localhost:3001/api/friendships/pending/${currentUserId}`);
                
                const response = await axios.get(`http://localhost:3001/api/friendships/pending/${currentUserId}`);
                
                console.log('DEBUG: Response status:', response.status);
                console.log('DEBUG: Response data:', response.data);
                
                setFriendRequests(response.data);
            } catch (error) {
                console.error("Error fetching friend requests:", error);
                console.error("Error details:", error.response?.data);
            }
        };

        if (currentUserId) {
            fetchFriendRequests();
        } else {
            console.log('DEBUG: currentUserId is not set');
        }
    }, [currentUserId]);

    const handleResponse = async (requestId, status) => {
        try {
            await axios.put(`http://localhost:3001/api/friendships/${requestId}`, { status });
            setFriendRequests(friendRequests.filter(request => request.id !== requestId));
        } catch (error) {
            console.error("Error updating friend request:", error);
        }
    };

    console.log("DEBUG: friendRequests state:", friendRequests);

    // Adaugă acest efect pentru încărcarea invitațiilor
    useEffect(() => {
        const fetchChallengeInvites = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:3001/api/userChallenge/pending/${currentUserId}`
                );
                setChallengeInvites(response.data);
            } catch (error) {
                console.error("Error fetching challenge invites:", error);
            }
        };
        
        if (currentUserId) {
            fetchChallengeInvites();
        }
    }, [currentUserId]);

    // Funcție pentru răspuns la invitație
    const handleChallengeResponse = async (inviteId, status) => {
        try {
            await axios.put(`http://localhost:3001/api/userChallenge/${inviteId}`, { status });
            setChallengeInvites(prev => prev.filter(invite => invite.id !== inviteId));
        } catch (error) {
            console.error("Error updating challenge invite:", error);
        }
    };

    return (
        <div className="notifications-container">
            <h2>Friend Requests</h2>
            {friendRequests.length === 0 ? (
                <p>No pending friend requests</p>
                ) : (
                <ul className="friend-requests-list">
                    {friendRequests.map(request => (
                        <li key={request.id} className="friend-request">
                            <span>{request.requester.username} sent you a friend request</span>
                            <div className="request-actions">
                                <button 
                                    className="accept-btn"
                                    onClick={() => handleResponse(request.id, "accepted")}
                                    title="Accept"
                                >
                                    ✓
                                </button>
                                <button 
                                    className="decline-btn"
                                    onClick={() => handleResponse(request.id, "declined")}
                                    title="Decline"
                                >
                                    ×
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <h2>Challenge Invitations</h2>
                {challengeInvites.length === 0 ? (
                <p>No pending challenge invites</p>
            ) : (
                <ul className="challenge-invites-list">
                    {challengeInvites.map(invite => (
                        <li key={invite.id} className="challenge-invite">
                            <span>
                                Your friend {invite.creator} created: 
                                <strong>{invite.challengeTitle}</strong>
                            </span>
                            <div className="invite-actions">
                                <button 
                                    className="accept-btn"
                                    onClick={() => handleChallengeResponse(invite.id, 'accepted')}
                                    title="Accept"
                                >
                                    ✓
                                </button>
                                <button 
                                    className="decline-btn"
                                    onClick={() => handleChallengeResponse(invite.id, 'declined')}
                                    title="Decline"
                                >
                                    ×
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Notifications;