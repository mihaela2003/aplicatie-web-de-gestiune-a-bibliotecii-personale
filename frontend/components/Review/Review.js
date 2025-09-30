import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import './Review.css';

const Review = () => {
  const { id:bookId} = useParams();
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [wholeNumber, setWholeNumber] = useState(0);
  const [decimalPart, setDecimalPart] = useState(0);
  const [existingReview, setExistingReview] = useState(null);
  const navigate = useNavigate();
  
  // Moods selection
  const [moods, setMoods] = useState({
    adventurous: false,
    emotional: false,
    inspiring: false,
    challenging: false,
    lighthearted: false,
    dark: false,
    mysterious: false,
    reflective: false,
    funny: false,
    relaxing: false,
    hopeful: false,
    sad: false,
    informative: false,
    tense: false,
  });

  // Pacing selection
  const [pacing, setPacing] = useState('');

  // Trigger warnings
  const [triggerWarnings, setTriggerWarnings] = useState({
    violence: false,
    abuse: false,
    torture: false,
    racism: false,
    sexism: false,
    misogyny: false,
    homophobia: false,
    transphobia: false,
    incest: false,
    self_harm: false,
    suicide: false,
    eating_disorders: false,
    fat_shaming: false,
  });

  // Book characteristics
  const [characteristics, setCharacteristics] = useState({
    plotOrCharacter: '',
    characterDevelopment: '',
    charactersLoveable: '',
    flawsFocus: ''
  });

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

// Verificăm dacă există deja un review la încărcarea componentei
useEffect(() => {
  const checkExistingReview = async () => {
    const userId = getCurrentUserId(); 
    console.log("user id: ", userId);
    if (!userId) {
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3001/api/reviews/book/${bookId}/user/${userId}`);
      if (response.data.exists) {
        const review = response.data.review;
        console.log('Retrieved review:', review); // Debug log
        setExistingReview(review);
        
        // Setăm valorile existente
        setRating(review.rating);
        setWholeNumber(Math.floor(review.rating));
        setDecimalPart(Math.round((review.rating % 1) * 100));
        setReviewText(review.reviewText || '');
        setPacing(review.bookPacing || '');
        
        setCharacteristics({
          plotOrCharacter: review.plotOrCharacter || '',
          characterDevelopment: review.characterDevelopment || '',
          charactersLoveable: review.charactersLoveable || '',
          flawsFocus: review.flawsFocus || ''
        });

        // Use Moods instead of Mood (note the capital M and plural)
        console.log('Moods data from API:', review.Moods);
        if (review.Moods && Array.isArray(review.Moods) && review.Moods.length > 0) {
          const updatedMoods = { ...moods };
          // Reset all to false
          Object.keys(updatedMoods).forEach(key => updatedMoods[key] = false);
          
          review.Moods.forEach(mood => {
            const moodName = mood.name.toLowerCase();
            console.log(`Processing mood: ${moodName}`);
            if (moodName in updatedMoods) {
              updatedMoods[moodName] = true;
            }
          });
          setMoods(updatedMoods);
        }
        
        // Use TriggerWarnings instead of TW
        console.log('TriggerWarnings data from API:', review.TriggerWarnings);
        if (review.TriggerWarnings && Array.isArray(review.TriggerWarnings) && review.TriggerWarnings.length > 0) {
          const updatedTW = { ...triggerWarnings };
          // Reset all to false
          Object.keys(updatedTW).forEach(key => updatedTW[key] = false);
          
          review.TriggerWarnings.forEach(tw => {
            const twName = tw.name.toLowerCase().replace(/\s+/g, '_');
            console.log(`Processing TW: ${twName}`);
            if (twName in updatedTW) {
              updatedTW[twName] = true;
            }
          });
          setTriggerWarnings(updatedTW);
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching review:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  checkExistingReview();
}, [bookId]);

const handleSubmit = async (e) => {
  e.preventDefault();
  const finalRating = wholeNumber + (decimalPart / 100);
  
  // Pregătim datele pentru trimitere
  const selectedMoods = Object.entries(moods)
    .filter(([_, isChecked]) => isChecked)
    .map(([moodKey]) => moodKey);

  const selectedTriggerWarnings = Object.entries(triggerWarnings)
    .filter(([_, isChecked]) => isChecked)
    .map(([twKey]) => twKey);

  try {
    const response = await axios.post('http://localhost:3001/api/reviews', {
      rating: finalRating,
      bookPacing: pacing,
      plotOrCharacter: characteristics.plotOrCharacter,
      characterDevelopment: characteristics.characterDevelopment,
      charactersLoveable: characteristics.charactersLoveable,
      flawsFocus: characteristics.flawsFocus,
      reviewText: reviewText,
      moods: selectedMoods,
      triggerWarnings: selectedTriggerWarnings,
      googleBooksId: bookId,
      userId: userId 
    });

    console.log('Review saved successfully:', response.data);
    navigate(`/book/${bookId}`);
  } catch (error) {
    console.error('Error saving review:', error);
  }
};

if (loading) {
  return <div className="main-content">Loading...</div>;
}


  return (
    <div className='main-content'>
    <div className="review-container">
      <h2>Leave a Review</h2>
      
      {/* Rating Section */}
      <div className="rating-section">
  <h3>Rating</h3>
<div className="rating-dropdowns">
  <select 
    value={wholeNumber} 
    onChange={(e) => {
      const value = Number(e.target.value);
      setWholeNumber(value);
      if(value === 5) setDecimalPart(0); // Resetăm zecimalele când se selectează 5
    }}
    className="rating-select"
  >
    {[0, 1, 2, 3, 4, 5].map((num) => (
      <option key={num} value={num}>{num}</option>
    ))}
  </select>
  
  <select
    value={decimalPart}
    onChange={(e) => setDecimalPart(Number(e.target.value))}
    className="rating-select"
    disabled={wholeNumber === 5} // Dezactivăm dropdown-ul când wholeNumber este 5
  >
    <option value={0}></option>
    <option value={25}>25</option>
    <option value={50}>50</option>
    <option value={75}>75</option>
  </select>
  
  <div className="rating-display">
    {(wholeNumber + decimalPart/100).toFixed(2)}
    <span className="star-icon">★</span>
  </div>
</div>
</div>

<div className="moods-section">
  <h3>This book would be for someone who is in the mood for...</h3>
  <div className="moods-grid">
    {Object.entries(moods).map(([moodKey, isChecked]) => (
      <label key={moodKey}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => setMoods({...moods, [moodKey]: !isChecked})}
        />
        <span>
          {moodKey
            .replace(/_/g, ' ')
            .replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
        </span>
      </label>
    ))}
  </div>
</div>

      {/* Pacing Section */}
      <div className="pacing-section">
  <h3>Book Pacing</h3>
  <div className="pacing-options">
    {['Slow', 'Medium', 'Fast'].map((pace) => (
      <label key={pace} className="pacing-option">
        <input
          type="radio"
          name="pacing"
          checked={pacing === pace}
          onChange={() => setPacing(pace)}
        />
        <span className="custom-radio"></span>
        <span className="pace-label">{pace}</span>
      </label>
    ))}
  </div>
</div>

      {/* Trigger Warnings Section */}
      <div className="triggers-section">
  <h3>Trigger Warnings</h3>
  <div className="triggers-grid">
    {Object.entries(triggerWarnings).map(([triggerKey, isChecked]) => (
      <label key={triggerKey}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => setTriggerWarnings({
            ...triggerWarnings,
            [triggerKey]: !isChecked
          })}
        />
        <span>
          {triggerKey
            .replace(/_/g, ' ')
            .replace(/(^\w|\s\w)/g, m => m.toUpperCase())
            .replace('Trasphobia', 'Transphobia') // Corectare typo
          }
        </span>
      </label>
    ))}
  </div>
</div>

      {/* Characteristics Section */}
      <div className="characteristics-section">
        <h3>Book Characteristics</h3>
        <div className="characteristic">
          <label>Is this book mainly plot or character driven?</label>
          <select
            value={characteristics.plotOrCharacter}
            onChange={(e) => setCharacteristics({
              ...characteristics,
              plotOrCharacter: e.target.value
            })}
          >
            <option value=""></option>
            <option value="Plot">Plot driven</option>
            <option value="Character">Character driven</option>
            <option value="Balanced">Balanced</option>
            <option value="N/A">N/A</option>
          </select>

          <label>Is there strong character development?</label>
          <select
            value={characteristics.characterDevelopment}
            onChange={(e) => setCharacteristics({
              ...characteristics,
              characterDevelopment: e.target.value
            })}
          >
            <option value=""></option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Complicated">It's complicated</option>
            <option value="N/A">N/A</option>
          </select>

          <label>Did you find the characters loveable?</label>
          <select
            value={characteristics.charactersLoveable}
            onChange={(e) => setCharacteristics({
              ...characteristics,
              charactersLoveable: e.target.value
            })}
          >
            <option value=""></option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Complicated">It's complicated</option>
            <option value="N/A">N/A</option>
          </select>

          <label>Are the flaws of the main character(s) a maine focus of the book?</label>
          <select
            value={characteristics.flawsFocus}
            onChange={(e) => setCharacteristics({
              ...characteristics,
              flawsFocus: e.target.value
            })}
          >
            <option value=""></option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Complicated">It's complicated</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
      </div>

      {/* Review Text Section */}
      <div className="review-text-section">
  <h3>Your Review</h3>
  <textarea
    value={reviewText}
    onChange={(e) => setReviewText(e.target.value)}
    placeholder="Share your thoughts about this book..."
    className="review-textarea"
  />
</div>

      <button type="submit" onClick={handleSubmit}>Submit Review</button>
    </div>
    </div>
  );
};

export default Review;