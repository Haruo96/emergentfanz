// Landing Page JavaScript

// Initialize Lucide icons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  lucide.createIcons();
  initializeAnimations();
  initializeScrollEffects();
});

// Modal functions
function showLoginModal() {
  document.getElementById('login-modal').classList.add('show');
  document.getElementById('login-modal').style.display = 'grid';
  document.body.style.overflow = 'hidden';
}

function showSignupModal() {
  document.getElementById('signup-modal').classList.add('show');
  document.getElementById('signup-modal').style.display = 'grid';
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
}

function switchModal(currentModalId, targetModalId) {
  closeModal(currentModalId);
  setTimeout(() => {
    if (targetModalId === 'login-modal') {
      showLoginModal();
    } else {
      showSignupModal();
    }
  }, 150);
}

// Navigation functions
function scrollToDemo() {
  document.getElementById('demo').scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  });
}

function enterApp() {
  // Close any open modals
  closeModal('login-modal');
  closeModal('signup-modal');
  
  // Set logged in state
  localStorage.setItem('user_logged_in', 'true');
  
  // Redirect to the main app
  window.location.href = 'index.html';
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    const modalId = e.target.id;
    closeModal(modalId);
  }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal('login-modal');
    closeModal('signup-modal');
  }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Initialize animations
function initializeAnimations() {
  // Add animation classes to hero elements
  const heroTitle = document.querySelector('h1');
  const heroSubtitle = document.querySelector('h1 + p');
  const heroButtons = document.querySelector('.flex.flex-col.sm\\:flex-row');
  
  if (heroTitle) heroTitle.classList.add('hero-title');
  if (heroSubtitle) heroSubtitle.classList.add('hero-subtitle');
  if (heroButtons) heroButtons.classList.add('hero-buttons');
}

// Intersection Observer for scroll animations
function initializeScrollEffects() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, observerOptions);

  // Observe elements for animation
  document.querySelectorAll('.feature-card, .testimonial-card, .stat-item').forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
  const nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Form validation
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll('input[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });
  
  return isValid;
}

// Add form validation styles
const style = document.createElement('style');
style.textContent = `
  .error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
  }
  
  .nav.scrolled {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px);
  }
`;
document.head.appendChild(style);

// Performance optimization: Lazy load images
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// Add loading states to buttons
function addLoadingState(button) {
  const originalText = button.textContent;
  button.textContent = 'Loading...';
  button.disabled = true;
  button.classList.add('loading');
  
  // Simulate loading
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    button.classList.remove('loading');
  }, 1500);
}

// Add click handlers for demo buttons
document.querySelectorAll('button').forEach(button => {
  if (button.textContent.includes('Get Started') || 
      button.textContent.includes('Create Account') || 
      button.textContent.includes('Sign In')) {
    button.addEventListener('click', function() {
      addLoadingState(this);
    });
  }
});

// Analytics tracking (placeholder)
function trackEvent(eventName, properties = {}) {
  console.log('Event tracked:', eventName, properties);
  // In a real app, you would send this to your analytics service
}

// Track user interactions
document.addEventListener('click', function(e) {
  if (e.target.matches('button')) {
    trackEvent('button_click', {
      button_text: e.target.textContent,
      page: 'landing'
    });
  }
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.classList.toggle('hidden');
  }
}

// Add mobile menu if screen is small
function checkMobileMenu() {
  if (window.innerWidth < 768) {
    // Add mobile menu functionality if needed
  }
}

window.addEventListener('resize', checkMobileMenu);
checkMobileMenu();

// Preload critical resources
function preloadResources() {
  const criticalImages = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Initialize preloading
document.addEventListener('DOMContentLoaded', preloadResources);

// Add error handling for failed image loads
document.addEventListener('error', function(e) {
  if (e.target.tagName === 'IMG') {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMyNC40MTgzIDI4IDI4IDI0LjQxODMgMjggMjBDMjggMTUuNTgxNyAyNC40MTgzIDEyIDIwIDEyQzE1LjU4MTcgMTIgMTIgMTUuNTgxNyAxMiAyMEMxMiAyNC40MTgzIDE1LjU4MTcgMjggMjAgMjhaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
  }
}, true);

console.log('Landing page initialized successfully!');