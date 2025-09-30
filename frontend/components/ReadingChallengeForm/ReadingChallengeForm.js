import "./ReadingChallengeForm.css";
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useParams, useNavigate} from 'react-router-dom';

const ReadingChallengeForm = ({editMode = false}) => {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdChallengeId, setCreatedChallengeId] = useState(null);
    const [isLoading, setIsLoading] = useState(editMode);
    const navigate = useNavigate();
    const {id: challengeId} = useParams();
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
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        isPublic: false,
        quests: []
      });
    
      const [showQuestForm, setShowQuestForm] = useState(false);
      const [currentQuest, setCurrentQuest] = useState({
        prompt: '',
        type: 'custom',
        targetCount: 1
    });
    const [editingQuestIndex, setEditingQuestIndex] = useState(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      };
    
      const handleQuestInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentQuest(prev => ({
          ...prev,
          [name]: name === 'targetCount' ? parseInt(value) || 0 : value
        }));
    };

      const addQuest = () => {
        if (editingQuestIndex !== null) {
          // Update existing quest
          setFormData(prev => ({
            ...prev,
            quests: prev.quests.map((quest, index) => 
              index === editingQuestIndex ? currentQuest : quest
            )
          }));
          setEditingQuestIndex(null);
        } else {
          // Add new quest
          setFormData(prev => ({
            ...prev,
            quests: [...prev.quests, currentQuest]
          }));
        }
        
        setCurrentQuest({
          prompt: '',
          type: 'custom',
          targetCount: 1
        });
        setShowQuestForm(false);
      };

      const editQuest = (index) => {
        const questToEdit = formData.quests[index];
        setCurrentQuest({
          id: questToEdit.id,
          prompt: questToEdit.prompt,
          type: questToEdit.type,
          targetCount: questToEdit.targetCount
        });
        setEditingQuestIndex(index);
        setShowQuestForm(true);
      };

      const deleteQuest = (index) => {
        if (window.confirm('Are you sure you want to delete this quest?')) {
          setFormData(prev => ({
            ...prev,
            quests: prev.quests.filter((_, i) => i !== index)
          }));
        }
      };

      const cancelQuestEdit = () => {
        setCurrentQuest({
          prompt: '',
          type: 'custom',
          targetCount: 1
        });
        setEditingQuestIndex(null);
        setShowQuestForm(false);
      };
      
        const handleSubmit = async (e) => {
          e.preventDefault();

      if (editMode) {
      try {
        // Update challenge
        const response = await fetch(
          `http://localhost:3001/api/readingChallenge/${challengeId}?userId=${userId}`, 
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              startDate: formData.startDate,
              endDate: formData.endDate,
              isPublic: formData.isPublic
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update challenge');
        }
        
        // Get original quests to compare with current ones
        const originalQuestsResponse = await fetch(
          `http://localhost:3001/api/challengeQuest/${challengeId}/quests`
        );
        const originalQuestsData = await originalQuestsResponse.json();
        const originalQuests = originalQuestsData.quests || [];
        
        // Separate quests into categories
        const existingQuests = formData.quests.filter(quest => quest.id);
        const newQuests = formData.quests.filter(quest => !quest.id);
        const currentQuestIds = existingQuests.map(q => q.id);
        const deletedQuests = originalQuests.filter(q => !currentQuestIds.includes(q.id));
        
        // Delete removed quests
        if (deletedQuests.length > 0) {
          const deletePromises = deletedQuests.map(quest => 
            fetch(`http://localhost:3001/api/challengeQuest/${challengeId}/quests/${quest.id}`, {
              method: 'DELETE'
            })
          );
          await Promise.all(deletePromises);
        }
        
        // Update existing quests
        if (existingQuests.length > 0) {
          const questUpdatePromises = existingQuests.map(quest => {
            return fetch(
              `http://localhost:3001/api/challengeQuest/${challengeId}/quests/${quest.id}`, 
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: quest.prompt,
                  type: quest.type,
                  targetCount: quest.targetCount
                })
              }
            );
          });
          await Promise.all(questUpdatePromises);
        }
        
        // Create new quests
        if (newQuests.length > 0) {
          const questCreatePromises = newQuests.map(quest => {
            return fetch(
              `http://localhost:3001/api/challengeQuest/${challengeId}/quests`, 
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: quest.prompt,
                  type: quest.type,
                  targetCount: quest.targetCount
                })
              }
            );
          });
          await Promise.all(questCreatePromises);
        }
        
        navigate(`/challengedetails/${challengeId}`);
        
      } catch (error) {
        console.error('Update error:', error);
      }
    } else {
        // Create mode logic remains the same
        try {
          // 1. Creăm reading challenge-ul
          const challengeResponse = await fetch('http://localhost:3001/api/readingChallenge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              startDate: formData.startDate,
              endDate: formData.endDate,
              isPublic: formData.isPublic, 
              userId: userId
            }),
          });
      
          if (!challengeResponse.ok) {
            const errorData = await challengeResponse.json();
            throw new Error(errorData.error || 'Failed to create reading challenge');
          }
      
          const challengeData = await challengeResponse.json();
          console.log('Challenge created:', challengeData); // Pentru debug
          
          if (!challengeData.id) {
            throw new Error('Challenge ID not received from server');
          }
      
          const challengeId = challengeData.id;
          console.log("challenge id:", challengeId);
      
          // 2. Creăm quest-urile doar dacă există
        if (formData.quests.length > 0) {
            const questPromises = formData.quests.map(quest => {
              const questData = {
                prompt: quest.prompt,
                type: quest.type,
                targetCount: Number(quest.targetCount) // Asigură-te că e număr
              };
              
              console.log('Sending quest data:', questData); // Debug
              
              return fetch(`http://localhost:3001/api/challengeQuest/${challengeId}/quests`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(questData),
              }).then(async response => {
                if (!response.ok) {
                  const errorData = await response.json();
                  console.error('Quest error:', errorData);
                  throw new Error(errorData.error || 'Quest creation failed');
                }
                return response.json();
              });
            });
      
            const questResults = await Promise.all(questPromises);
            console.log('Quests created:', questResults);
          }
      
          setCreatedChallengeId(challengeId);
          setShowSuccessModal(true);

           setTimeout(() => {
          navigate('/readingchallenges');
      }, 5000);
          
              
            } catch (error) {
              console.error('Full error:', error);
            }
          }
          };

      const handleShareChallenge = async (challengeId) => {
        console.log("challenge id handle: ", challengeId);
  try {
    const response = await fetch(
      `http://localhost:3001/api/readingChallenge/${challengeId}/share`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
         body: JSON.stringify({ userId })
      }
    );
    
    if (response.ok) {
    } else {
      const errorData = await response.json();
    }
    setShowSuccessModal(false);
  } catch (error) {
    console.error('Sharing error:', error);
  }
};

  useEffect(() => {
    if (editMode) {
      const fetchChallengeData = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/readingChallenge/${challengeId}?userId=${userId}`);
          if (!response.ok) throw new Error('Failed to fetch challenge');
          
          const data = await response.json();
          setFormData({
            title: data.title,
            description: data.description || '',
            startDate: data.startDate ? data.startDate.split('T')[0] : '',
            endDate: data.endDate ? data.endDate.split('T')[0] : '',
            isPublic: data.isPublic,
            userId: userId,
            quests: []
          });
          
          // Fetch quests
          const questsResponse = await fetch(
            `http://localhost:3001/api/challengeQuest/${challengeId}/quests`
          );
          if (!questsResponse.ok) throw new Error('Failed to fetch quests');
          
          const questsData = await questsResponse.json();
          setFormData(prev => ({
            ...prev,
            quests: questsData.quests.map(q => ({
              id: q.id,
              prompt: q.prompt,
              type: q.type,
              targetCount: q.targetCount
            }))
          }));
          
        } catch (error) {
          console.error('Fetch error:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchChallengeData();
    }
  }, [editMode, challengeId]);

    if (isLoading) return <div>Loading challenge data...</div>;
    
    return (
        <div className="main-content">
        <div className="create-challenge-container">
          <h2>{editMode?'Edit':'Create New'} Reading Challenge</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
    
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
              />
            </div>

            <div className="date-group">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="quests-section">
          <h3>Quests</h3>
          {formData.quests.length === 0 && (
            <p className="no-quests-message">No quests added yet. Click "Add Quest" to get started!</p>
          )}
          {formData.quests.map((quest, index) => (
            <div key={index} className="quest-item">
              <div className="quest-content">
                <div className="quest-details">
                  <p><strong>{quest.prompt}</strong></p>
                  <p className="quest-meta">Type: {quest.type} | Target: {quest.targetCount}</p>
                </div>
                <div className="quest-actions">
                  <button 
                    type="button" 
                    className="btn-edit-quest"
                    onClick={() => editQuest(index)}
                    title="Edit this quest"
                  >
                     Edit
                  </button>
                  <button 
                    type="button" 
                    className="btn-delete-quest"
                    onClick={() => deleteQuest(index)}
                    title="Delete this quest"
                  >
                     Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button 
            type="button" 
            className="btn-add-quest"
            onClick={() => setShowQuestForm(true)}
          >
            + Add Quest to the Challenge
          </button>
        </div>

        {showQuestForm && (
          <div className="quest-form-popup">
            <div className="quest-form-overlay" onClick={cancelQuestEdit}></div>
            <div className="quest-form-content">
              <h4>{editingQuestIndex !== null ? 'Edit Quest' : 'Add New Quest'}</h4>
              
              <div className="form-group">
                <label>Quest Description/Prompt</label>
                <input
                  type="text"
                  name="prompt"
                  value={currentQuest.prompt}
                  onChange={handleQuestInputChange}
                  placeholder="e.g., Read a book with more than 300 pages"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quest Type</label>
                <select
                  name="type"
                  value={currentQuest.type}
                  onChange={handleQuestInputChange}
                >
                  <option value="custom">Custom Quest</option>
                  <option value="book_based">Book Based</option>
                  <option value="genre_based">Genre Based</option>
                  <option value="count_based">Count Based</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Target Count</label>
                <input
                  type="number"
                  name="targetCount"
                  min="1"
                  value={currentQuest.targetCount}
                  onChange={handleQuestInputChange}
                  placeholder="How many times to complete this quest"
                  required
                />
              </div>

              <div className="quest-form-buttons">
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={cancelQuestEdit}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-save"
                  onClick={addQuest}
                  disabled={!currentQuest.prompt.trim()}
                >
                  {editingQuestIndex !== null ? 'Update Quest' : 'Save Quest'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="form-group public-toggle">
              <label>Do you want to make it public?</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                <label htmlFor="isPublic" className="toggle-label"></label>
              </div>
            </div>

            <button type="submit" className="btn-create-challenge">
              {editMode ? 'Update Challenge' : 'Create Challenge'}
            </button>
          </form>
        </div>
            {showSuccessModal && (
              <div className="modal">
                <div className="modal-content">
                  <p>Challenge created! Wanna share it with your friends?</p>
                  <div className="modal-buttons">
                    <button onClick={() => setShowSuccessModal(false)}>No</button>
                    <button onClick={() => handleShareChallenge(createdChallengeId)}>
                      Share
                    </button>
                  </div>
                </div>
            </div>
            )}
    </div>
  );
};

export default ReadingChallengeForm;