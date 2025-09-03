import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Header Component
const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>SocialVault</h1>
          <span className="logo-tagline">Premium Content Platform</span>
        </div>
        <nav className="nav">
          <button
            className={`nav-btn ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>
          <button
            className={`nav-btn ${activeTab === 'creators' ? 'active' : ''}`}
            onClick={() => setActiveTab('creators')}
          >
            Creators
          </button>
          <button className="btn-primary">Sign Up</button>
        </nav>
      </div>
    </header>
  );
};

// Content Card Component
const ContentCard = ({ content, onViewContent }) => {
  const formatPrice = (price) => price ? `$${price.toFixed(2)}` : 'Free';
  const formatCount = (count) => count > 999 ? `${(count/1000).toFixed(1)}k` : count;

  return (
    <div className="content-card">
      <div className="content-header">
        <div className="creator-info">
          <img
            src={content.creator_profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
            alt={content.creator_display_name}
            className="creator-avatar"
          />
          <div>
            <h4 className="creator-name">{content.creator_display_name}</h4>
            <span className="creator-username">@{content.creator_username}</span>
          </div>
        </div>
        <div className="content-price">
          {content.subscription_only ? (
            <span className="subscription-badge">Subscribers Only</span>
          ) : (
            <span className={`price-badge ${content.is_free ? 'free' : 'paid'}`}>
              {formatPrice(content.price)}
            </span>
          )}
        </div>
      </div>
      
      <div className="content-media" onClick={() => onViewContent(content)}>
        {content.is_locked ? (
          <div className="locked-content">
            <div className="lock-overlay">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 10h12v10H6V10zm6-4c1.1 0 2 .9 2 2v2H10V8c0-1.1.9-2 2-2m0-2c-2.2 0-4 1.8-4 4v2c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V12c0-1.1-.9-2-2-2V8c0-2.2-1.8-4-4-4z"/>
              </svg>
              <p>Premium Content</p>
            </div>
            <div className="preview-blur">
              <div className="blur-placeholder"></div>
            </div>
          </div>
        ) : (
          content.media_urls.length > 0 && (
            <img
              src={content.media_urls[0]}
              alt={content.title}
              className="content-image"
            />
          )
        )}
      </div>
      
      <div className="content-body">
        <h3 className="content-title">{content.title}</h3>
        <p className="content-description">{content.description}</p>
        
        <div className="content-tags">
          {content.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">#{tag}</span>
          ))}
        </div>
        
        <div className="content-stats">
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>{formatCount(content.like_count)}</span>
          </div>
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H7v-2h10v2zm0-4H7V8h10v2z"/>
            </svg>
            <span>{formatCount(content.comment_count)}</span>
          </div>
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            <span>{formatCount(content.view_count)}</span>
          </div>
        </div>
      </div>
      
      {content.is_locked && (
        <div className="unlock-section">
          <button className="unlock-btn">
            {content.subscription_only ? 'Subscribe to View' : `Unlock for ${formatPrice(content.price)}`}
          </button>
        </div>
      )}
    </div>
  );
};

// Creator Card Component
const CreatorCard = ({ creator, onViewProfile }) => {
  const formatCount = (count) => count > 999 ? `${(count/1000).toFixed(1)}k` : count;

  return (
    <div className="creator-card" onClick={() => onViewProfile(creator)}>
      <div className="creator-cover">
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop"
          alt="Cover"
          className="creator-cover-img"
        />
      </div>
      <div className="creator-profile">
        <img
          src={creator.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'}
          alt={creator.display_name}
          className="creator-profile-img"
        />
        <div className="creator-details">
          <h3 className="creator-name">{creator.display_name}</h3>
          <span className="creator-username">@{creator.username}</span>
          <p className="creator-bio">{creator.bio}</p>
          <div className="creator-stats">
            <span className="subscriber-count">{formatCount(creator.subscriber_count)} subscribers</span>
          </div>
        </div>
      </div>
      <div className="creator-actions">
        <button className="btn-follow">Follow</button>
        <button className="btn-subscribe">Subscribe</button>
      </div>
    </div>
  );
};

// Content Modal Component
const ContentModal = ({ content, isOpen, onClose }) => {
  if (!isOpen || !content) return null;

  const formatPrice = (price) => price ? `$${price.toFixed(2)}` : 'Free';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{content.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-creator-info">
            <img
              src={content.creator_profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
              alt={content.creator_display_name}
              className="creator-avatar"
            />
            <div>
              <h4>{content.creator_display_name}</h4>
              <span>@{content.creator_username}</span>
            </div>
          </div>
          
          {content.is_locked ? (
            <div className="locked-modal-content">
              <div className="lock-message">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 10h12v10H6V10zm6-4c1.1 0 2 .9 2 2v2H10V8c0-1.1.9-2 2-2m0-2c-2.2 0-4 1.8-4 4v2c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V12c0-1.1-.9-2-2-2V8c0-2.2-1.8-4-4-4z"/>
                </svg>
                <h3>Premium Content</h3>
                <p>This content is available to premium members only</p>
                <div className="unlock-options">
                  {content.subscription_only ? (
                    <button className="btn-primary large">Subscribe to Creator</button>
                  ) : (
                    <button className="btn-primary large">Unlock for {formatPrice(content.price)}</button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="modal-media">
              {content.media_urls.map((url, index) => (
                <img key={index} src={url} alt={content.title} className="modal-image" />
              ))}
            </div>
          )}
          
          <div className="modal-description">
            <p>{content.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [content, setContent] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [contentResponse, creatorsResponse] = await Promise.all([
        axios.get(`${API}/content`),
        axios.get(`${API}/creators`)
      ]);
      
      setContent(contentResponse.data);
      setCreators(creatorsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContent = (contentItem) => {
    setSelectedContent(contentItem);
    setModalOpen(true);
  };

  const handleViewProfile = (creator) => {
    console.log('View profile:', creator);
    // TODO: Implement profile view
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedContent(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading amazing content...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'discover' && (
          <div className="discover-section">
            <div className="section-header">
              <h2>Discover Premium Content</h2>
              <p>Explore exclusive content from your favorite creators</p>
            </div>
            
            <div className="content-grid">
              {content.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                  onViewContent={handleViewContent}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'creators' && (
          <div className="creators-section">
            <div className="section-header">
              <h2>Featured Creators</h2>
              <p>Follow and support your favorite content creators</p>
            </div>
            
            <div className="creators-grid">
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <ContentModal
        content={selectedContent}
        isOpen={modalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default App;