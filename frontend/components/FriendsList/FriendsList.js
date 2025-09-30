import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate} from "react-router-dom";
import {jwtDecode} from 'jwt-decode';
import { FaUserCircle } from 'react-icons/fa';
import "./FriendsList.css";

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [nonFriends, setNonFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
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

  const fetchFriendships = (id) => {
    axios.get(`http://localhost:3001/api/friendships/requester/${id}`)
      .then(response => {
        console.log("All friendships data:", response.data);
        
        const visibleFriendships = response.data.filter(f => f.status !== 'hidden');
        
        const accepted = visibleFriendships.filter(f => f.status === 'accepted');
        const pending = visibleFriendships.filter(f => f.status === 'pending');
        const blocked = visibleFriendships.filter(f => f.status === 'blocked');
        
        setFriends(accepted);
        setPendingRequests(pending);
        setBlockedUsers(blocked);
      })
      .catch(error => console.error("Error fetching friendships:", error));
  };

  useEffect(() => {
    if (userId) {
      fetchFriendships(userId);
    }
  }, [userId]);

const searchUsers = (term) => {
  console.log("Searching for term:", term);
  console.log("Current userId:", userId);
  
  if (term.length > 2) {
    axios.get(`http://localhost:3001/api/users/search`, {
      params: {
        q: term,
        exclude: userId
      }
    })
    .then(response => {
      console.log("Raw search results:", response.data);
      
      // Get all friendships including hidden ones for search filtering
      axios.get(`http://localhost:3001/api/friendships/requester/${userId}`)
        .then(friendshipsResponse => {
          const allFriendships = friendshipsResponse.data;
          
          const allRelatedUserIds = allFriendships.map(f => 
            f.requesterId === userId ? f.recipientId : f.requesterId
          );
          
          console.log("All related user IDs to exclude:", allRelatedUserIds);
          
          const nonFriendUsers = response.data.filter(user => 
            !allRelatedUserIds.includes(user.id)
          );
          
          console.log("Final filtered non-friends:", nonFriendUsers);
          setNonFriends(nonFriendUsers);
        })
        .catch(error => {
          console.error("Error fetching friendships for search:", error);
          setNonFriends([]);
        });
    })
    .catch(error => {
      console.error("Error searching users:", error);
      setNonFriends([]);
    });
  } else {
    setNonFriends([]);
  }
};

  const sendFriendRequest = (recipientId) => {
    axios.post("http://localhost:3001/api/friendships/", {
      requesterId: userId,
      recipientId,
      status: "pending"
    })
    .then(() => {
      setShowAddFriend(false);
      setSearchTerm("");
      setNonFriends([]);
      fetchFriendships(userId);
    })
    .catch(error => console.error("Error sending friend request:", error));
  };

const handleFriendAction = (action, friendshipId) => {
  switch(action) {
    case "visit":
      const friendship = friends.find(f => f.id === friendshipId);
      if (friendship) {
        const currentUserId = parseInt(userId);
        const requesterId = parseInt(friendship.requesterId);
        const recipientId = parseInt(friendship.recipientId);
        
        console.log("=== DETAILED DEBUG INFO ===");
        console.log("Raw friendship object:", friendship);
        console.log("Raw userId from token:", userId);
        console.log("Parsed currentUserId:", currentUserId);
        console.log("Parsed requesterId:", requesterId);
        console.log("Parsed recipientId:", recipientId);
        console.log("Comparison currentUserId === requesterId:", currentUserId === requesterId);
        
        const friendUserId = (requesterId === currentUserId) ? recipientId : requesterId;
        
        console.log("Calculated friendUserId:", friendUserId);
        console.log("Navigation URL:", `/profile/${friendUserId}`);
        console.log("========================");
        
        let correctFriendId;
        if (currentUserId === requesterId) {
          correctFriendId = recipientId;
          console.log("LOGIC: Current user is requester, friend is recipient");
        } else {
          correctFriendId = requesterId;
          console.log("LOGIC: Current user is recipient, friend is requester");
        }
        
        console.log("Double-check correctFriendId:", correctFriendId);
        console.log("Are they equal?", friendUserId === correctFriendId);
        
        navigate(`/profile/${friendUserId}`);
      } else {
        console.error("Friendship not found for ID:", friendshipId);
      }
      break;
    case "delete":
      axios.delete(`http://localhost:3001/api/friendships/${friendshipId}`, { status: "accepted" })
        .then(() => fetchFriendships(userId))
        .catch(error => console.error("Error deleting friend:", error));
      break;
    case "block":
      axios.put(`http://localhost:3001/api/friendships/${friendshipId}`, { status: "blocked" })
        .then(() => fetchFriendships(userId))
        .catch(error => console.error("Error blocking friend:", error));
      break;
    default:
      break;
  }
};

  const cancelPendingRequest = (friendshipId) => {
    axios.delete(`http://localhost:3001/api/friendships/${friendshipId}`, { status: "pending" })
      .then(() => fetchFriendships(userId))
      .catch(error => console.error("Error canceling request:", error));
  };

  const unblockUser = (friendshipId) => {
    axios.put(`http://localhost:3001/api/friendships/${friendshipId}/unblock`)
      .then(() => fetchFriendships(userId))
      .catch(error => console.error("Error unblocking user:", error));
  };

  const getDisplayName = (friendship) => {
    const currentUserId = parseInt(userId);
    const requesterId = parseInt(friendship.requesterId);
    
    if (requesterId === currentUserId) {
      return friendship.recipient?.username || 'Unknown User';
    } else {
      return friendship.requester?.username || 'Unknown User';
    }
  };

  return (
    <div className="main-content">
    <div className="friends-main-container">
      {/* Left side - Friends List */}
      <div className="friends-list-section">
        <h2>My Friends ({friends.length})</h2>
        <div className="friends-grid">
          {friends.length === 0 ? (
            <div className="no-friends">
              <p>No friends yet. Start by adding some!</p>
            </div>
          ) : (
            friends.map(friendship => (
              <div 
                key={friendship.id} 
                className="friend-card"
                onClick={() => setSelectedFriend(selectedFriend?.id === friendship.id ? null : friendship)}
              >
                <div className="friend-avatar-container">
                  <FaUserCircle size={50} color="#555" />
                </div>
                <div className="friend-name">
                  {getDisplayName(friendship)}
                </div>
                
                {selectedFriend?.id === friendship.id && (
                  <div className="friend-actions-overlay">
                    <button 
                      className="action-btn visit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFriendAction("visit", friendship.id);
                      }}
                    >
                      Visit Profile
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFriendAction("delete", friendship.id);
                      }}
                    >
                      Delete Friend
                    </button>
                    <button 
                      className="action-btn block-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFriendAction("block", friendship.id);
                      }}
                    >
                      Block
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right side - Sidebar */}
      <div className="friends-sidebar">
        {/* Add New Friends Section */}
        <div className="sidebar-section">
          <button 
            className="add-friend-main-btn"
            onClick={() => setShowAddFriend(!showAddFriend)}
          >
            {showAddFriend ? 'Hide Search' : 'Add New Friends'}
          </button>

          {showAddFriend && (
            <div className="add-friend-container">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="friend-search-input"
              />
              
              {searchTerm.length > 2 && (
                <div className="search-results-container">
                  {nonFriends.length === 0 ? (
                    <div className="no-results">
                      No users found for "{searchTerm}"
                    </div>
                  ) : (
                    nonFriends.map(user => (
                      <div key={user.id} className="search-result-item">
                        <div className="user-info">
                          <FaUserCircle size={24} color="#555" />
                          <span>{user.username}</span>
                        </div>
                        <button 
                          onClick={() => sendFriendRequest(user.id)}
                          className="add-user-btn"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Requests Section */}
        <div className="sidebar-section">
          <h3>Pending Requests ({pendingRequests.length})</h3>
          <div className="pending-list">
            {pendingRequests.length === 0 ? (
              <p className="empty-message">No pending requests</p>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} className="pending-item">
                  <div className="pending-user-info">
                    <FaUserCircle size={20} color="#555" />
                    <span>{getDisplayName(request)}</span>
                  </div>
                  <button 
                    className="cancel-btn"
                    onClick={() => cancelPendingRequest(request.id)}
                    title="Cancel request"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blocked Users Section */}
        <div className="sidebar-section">
          <h3>Blocked Users ({blockedUsers.length})</h3>
          <div className="blocked-list">
            {blockedUsers.length === 0 ? (
              <p className="empty-message">No blocked users</p>
            ) : (
              blockedUsers.map(blocked => (
                <div key={blocked.id} className="blocked-item">
                  <div className="blocked-user-info">
                    <FaUserCircle size={20} color="#555" />
                    <span>{getDisplayName(blocked)}</span>
                  </div>
                  <button 
                    className="unblock-btn"
                    onClick={() => unblockUser(blocked.id)}
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default FriendsList;