import React, { useState } from 'react';
import './CommunityReviews.css';

const CommunityReviews = ({ reviewsData }) => {
  const [showAllWarnings, setShowAllWarnings] = useState(false);

  if (!reviewsData) return <div className="loading-reviews">Loading reviews data...</div>;

  if (reviewsData.totalReviews === 0) {
    return (
      <div className="community-reviews">
        <h2>COMMUNITY REVIEWS</h2>
        <div className="no-reviews">
          <p>No reviews yet for this book.</p>
          <p>Be the first to share your thoughts!</p>
        </div>
      </div>
    );
  }

  // Helper function to render stars
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <span className="stars">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  // Helper function to render horizontal bar charts
  const renderBarChart = (data, colors = {}) => {
    const entries = Object.entries(data).filter(([key, value]) => value > 0);
    
    return (
      <div className="bar-chart">
        {entries.map(([key, percentage]) => (
          <div key={key} className="bar-item">
            <div className="bar-label">
              <span className="bar-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span className="bar-percentage">{percentage}%</span>
            </div>
            <div className="bar-container">
              <div 
                className={`bar-fill ${colors[key] || 'default'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Get top moods (limit to show most relevant ones)
  const getTopMoods = () => {
    if (!reviewsData.moods) return [];
    return Object.entries(reviewsData.moods)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Show top 10 moods
  };

  // Get trigger warnings that have been reported
  const getReportedWarnings = () => {
    if (!reviewsData.triggerWarnings) return [];
    return Object.entries(reviewsData.triggerWarnings)
      .filter(([, percentage]) => percentage > 0)
      .sort(([,a], [,b]) => b - a);
  };

  const topMoods = getTopMoods();
  const reportedWarnings = getReportedWarnings();
  const visibleWarnings = showAllWarnings ? reportedWarnings : reportedWarnings.slice(0, 6);
  console.log("topMoods:", topMoods);
  console.log("reportedWarnings:",reportedWarnings);
  console.log("visibleWarning:", visibleWarnings);

  return (
    <div className="community-reviews">
      <h2>COMMUNITY REVIEWS</h2>
      
      {/* Average Rating Section */}
      <div className="rating-section">
        <div className="average-rating">
          <span className="rating-number">{reviewsData.averageRating.toFixed(2)}★</span>
          {renderStars(reviewsData.averageRating)}
        </div>
        <div className="review-count">
          based on <span className="count-highlight">{reviewsData.totalReviews.toLocaleString()}</span> review{reviewsData.totalReviews !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Moods Section */}
      {topMoods.length > 0 && (
        <div className="section moods-section">
          <h3>MOODS</h3>
          <div className="moods-grid">
            {topMoods.map(([mood, percentage]) => (
              <div key={mood} className="mood-item">
                <span className="mood-name">
                  {mood.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
                </span>
                <div className="mood-stats">
                  <span className="mood-percentage">{percentage}%</span>
                  <div className="mood-bar-container">
                    <div 
                      className="mood-bar" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pace Section */}
      {reviewsData.pace && (
        <div className="section pace-section">
          <h3>Pace</h3>
          <div className="pace-bars">
            {Object.entries(reviewsData.pace)
              .filter(([, percentage]) => percentage > 0)
              .map(([pace, percentage]) => (
                <div key={pace} className="pace-item">
                  <div className="pace-info">
                    <span className="pace-label1">{pace.charAt(0).toUpperCase() + pace.slice(1)}</span>
                    <span className="pace-percentage">{percentage}%</span>
                  </div>
                  <div className="pace-bar-container">
                    <div 
                      className={`pace-bar pace-${pace.toLowerCase()}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Plot vs Character Driven */}
      {reviewsData.plotOrCharacter && (
        <div className="section characteristic-section">
          <h3>Plot or character driven?</h3>
          {renderBarChart(reviewsData.plotOrCharacter, {
            plot: 'plot-bar',
            character: 'character-bar',
            balanced: 'balanced-bar',
            na: 'na-bar'
          })}
        </div>
      )}

      {/* Character Development */}
      {reviewsData.characterDevelopment && (
        <div className="section characteristic-section">
          <h3>Strong character development?</h3>
          {renderBarChart(reviewsData.characterDevelopment, {
            yes: 'yes-bar',
            no: 'no-bar',
            complicated: 'complicated-bar',
            na: 'na-bar'
          })}
        </div>
      )}

      {/* Loveable Characters */}
      {reviewsData.loveableCharacters && (
        <div className="section characteristic-section">
          <h3>Loveable characters?</h3>
          {renderBarChart(reviewsData.loveableCharacters, {
            yes: 'yes-bar',
            no: 'no-bar',
            complicated: 'complicated-bar',
            na: 'na-bar'
          })}
        </div>
      )}

      {/* Flaws Focus */}
      {reviewsData.flawsFocus && (
        <div className="section characteristic-section">
          <h3>Flaws of characters a main focus?</h3>
          {renderBarChart(reviewsData.flawsFocus, {
            yes: 'yes-bar',
            no: 'no-bar',
            complicated: 'complicated-bar',
            na: 'na-bar'
          })}
        </div>
      )}

      {/* Content Warnings */}
      {reportedWarnings.length > 0 && (
        <div className="section warnings-section">
          <h3>CONTENT WARNINGS</h3>
          <p className="warnings-subtitle">Submitted by users as part of their reviews</p>
          
          <div className="warnings-grid">
            {visibleWarnings.map(([warning, percentage]) => (
              <div key={warning} className="warning-item">
                <span className="warning-name">
                  {warning.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
                </span>
                <span className="warning-percentage">{percentage}%</span>
              </div>
            ))}
          </div>
          
          {reportedWarnings.length > 6 && (
            <button 
              className="toggle-warnings-btn"
              onClick={() => setShowAllWarnings(!showAllWarnings)}
            >
              {showAllWarnings ? 'View less' : `SEE ALL ${reportedWarnings.length} warnings`}
            </button>
          )}
        </div>
      )}

      {/* Sample Reviews */}
      {reviewsData.sampleReviews && reviewsData.sampleReviews.length > 0 && (
        <div className="section sample-reviews-section">
          <h3>RECENT REVIEWS</h3>
          <div className="sample-reviews">
            {reviewsData.sampleReviews.map((review) => (
              <div key={review.id} className="sample-review">
                <div className="review-header">
                  <span className="reviewer-name">{review.username}</span>
                  <div className="review-rating">
                    <span className="rating-number">{review.rating}★</span>
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="review-text">{review.reviewText}</p>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityReviews;