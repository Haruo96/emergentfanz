// Global app state
const App = {
  currentPage: 'feed',
  currentUser: null,
  content: [],
  creators: [],
  currentCreator: null,
  likedPosts: new Set(),
  selectedTipAmount: null,
  uploadedFiles: []
};

// API Configuration
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:8001/api' 
  : `${window.location.origin}/api`;

// Utility functions
function formatPrice(price) {
  return price ? `$${parseFloat(price).toFixed(2)}` : 'Free';
}

function formatCount(count) {
  return count > 999 ? `${(count/1000).toFixed(1)}k` : count.toString();
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}

function createCreatorBadge(label) {
  return `<span class="creator-badge">${label}</span>`;
}

// API functions
async function fetchContent() {
  try {
    const response = await fetch(`${API_BASE}/content`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
  } catch (error) {
    console.error('Error fetching content:', error);
    return [];
  }
}

async function fetchCreators() {
  try {
    const response = await fetch(`${API_BASE}/creators`);
    if (!response.ok) throw new Error('Failed to fetch creators');
    return await response.json();
  } catch (error) {
    console.error('Error fetching creators:', error);
    return [];
  }
}

async function fetchContentById(contentId) {
  try {
    const response = await fetch(`${API_BASE}/content/${contentId}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
  } catch (error) {
    console.error('Error fetching content by ID:', error);
    return null;
  }
}

async function uploadContent(formData) {
  try {
    // In a real implementation, this would upload to the backend
    // For now, we'll simulate the upload
    const response = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) throw new Error('Failed to upload content');
    return await response.json();
  } catch (error) {
    console.error('Error uploading content:', error);
    // Return mock success for demo
    return { success: true, id: Date.now().toString() };
  }
}

// UI Rendering functions
function renderPostCard(post) {
  const isLiked = App.likedPosts.has(post.id);
  const isLocked = post.is_locked || (!post.is_free && post.price);
  
  return `
    <article class="post-card rounded-2xl border bg-white overflow-hidden shadow-sm">
      <div class="flex items-center gap-3 p-3">
        <img src="${post.creator_profile_image || 'https://i.pravatar.cc/150?img=1'}" class="h-9 w-9 rounded-full"/>
        <div class="flex-1">
          <div class="flex items-center gap-2 text-sm font-medium">
            ${post.creator_display_name || post.creator_username}
            ${createCreatorBadge('Verified')}
          </div>
          <div class="text-xs text-gray-500">${timeAgo(post.created_at)}</div>
        </div>
        <button class="p-2 rounded-lg hover:bg-gray-50">
          <i data-lucide="more-vertical" class="h-4 w-4"></i>
        </button>
      </div>
      
      <div class="relative bg-gray-50">
        ${isLocked ? `
          <div class="aspect-video grid place-items-center bg-gray-100 relative">
            <div class="locked-overlay">
              <i data-lucide="lock" class="h-10 w-10 text-white mb-2"></i>
              <p class="text-sm text-center px-4">Premium Content</p>
            </div>
            <button onclick="openSubscribeModal()" class="absolute bottom-3 left-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-medium shadow">
              ${post.subscription_only ? 'Subscribe to unlock' : `Unlock for ${formatPrice(post.price)}`}
            </button>
          </div>
        ` : `
          ${post.content_type === 'video' ? `
            <div class="relative">
              <img src="${post.media_urls[0] || 'https://picsum.photos/800/600'}" class="w-full aspect-video object-cover"/>
              <button class="absolute inset-0 grid place-items-center">
                <span class="p-4 rounded-full bg-black/40 backdrop-blur">
                  <i data-lucide="play" class="h-8 w-8 text-white"></i>
                </span>
              </button>
            </div>
          ` : `
            <img src="${post.media_urls[0] || 'https://picsum.photos/800/600'}" class="w-full object-cover"/>
          `}
        `}
      </div>
      
      <div class="p-3 space-y-3">
        <p class="text-sm">${post.description || post.title}</p>
        <div class="flex items-center gap-3 text-sm">
          <button onclick="toggleLike('${post.id}')" class="like-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border ${isLiked ? 'liked' : 'hover:bg-gray-50'}">
            <i data-lucide="heart" class="h-4 w-4"></i>
            ${isLiked ? 'Liked' : 'Like'}
          </button>
          <button class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border hover:bg-gray-50">
            <i data-lucide="message-square" class="h-4 w-4"></i>
            Comment
          </button>
          <button class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border hover:bg-gray-50">
            <i data-lucide="share-2" class="h-4 w-4"></i>
            Share
          </button>
          <div class="flex-1"></div>
          <button onclick="openTipModal()" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border bg-yellow-50 hover:bg-yellow-100">
            <i data-lucide="gift" class="h-4 w-4"></i>
            Tip
          </button>
        </div>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span><i data-lucide="heart" class="h-3 w-3 inline mr-1"></i>${formatCount(post.like_count)}</span>
          <span><i data-lucide="message-square" class="h-3 w-3 inline mr-1"></i>${formatCount(post.comment_count)}</span>
          <span><i data-lucide="eye" class="h-3 w-3 inline mr-1"></i>${formatCount(post.view_count)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderCreatorCard(creator, isSmall = false) {
  const cardClass = isSmall ? 'creator-card text-left rounded-2xl border bg-white overflow-hidden hover:shadow cursor-pointer' : 'creator-card text-left rounded-2xl border bg-white overflow-hidden hover:shadow cursor-pointer';
  
  return `
    <div class="${cardClass}" onclick="openCreatorProfile('${creator.id}')">
      <img src="https://picsum.photos/400/300?random=${creator.id}" class="w-full aspect-[4/3] object-cover"/>
      <div class="p-3">
        <div class="flex items-center gap-2">
          <img src="${creator.profile_image || 'https://i.pravatar.cc/150?img=' + (creator.id.charCodeAt(0) % 5 + 1)}" class="h-8 w-8 rounded-full"/>
          <div class="font-medium text-sm">${creator.display_name}</div>
          ${createCreatorBadge('Verified')}
        </div>
        <div class="mt-2 text-xs text-gray-600 line-clamp-2">${creator.bio || 'Content creator sharing exclusive material'}</div>
        <div class="mt-3 flex items-center gap-2 text-xs">
          <i data-lucide="wallet" class="h-4 w-4"></i>
          <span class="font-semibold">$${(Math.random() * 20 + 5).toFixed(2)}/mo</span>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          ${formatCount(creator.subscriber_count)} subscribers
        </div>
      </div>
    </div>
  `;
}

function renderProfileHeader(creator) {
  return `
    <div class="relative">
      <img src="https://picsum.photos/800/200?random=${creator.id}" class="w-full h-40 object-cover"/>
      <img src="${creator.profile_image || 'https://i.pravatar.cc/150?img=1'}" class="absolute -bottom-8 left-6 h-20 w-20 rounded-full ring-4 ring-white"/>
    </div>
    <div class="pt-10 px-6 pb-4 flex flex-wrap items-center gap-3">
      <div>
        <div class="flex items-center gap-2 text-lg font-bold">
          ${creator.display_name} 
          ${createCreatorBadge('Verified')}
        </div>
        <div class="text-sm text-gray-600">${creator.bio || 'Content creator'}</div>
        <div class="text-xs text-gray-500 mt-1">${formatCount(creator.subscriber_count)} subscribers</div>
      </div>
      <div class="flex-1"></div>
      <button onclick="openSubscribeModal()" class="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700">
        Subscribe $14.99/mo
      </button>
    </div>
  `;
}

function renderMediaGrid(locked = true) {
  const sampleImages = Array.from({length: 9}, (_, i) => `https://picsum.photos/300/300?random=${i + 10}`);
  
  return `
    <div class="media-grid">
      ${sampleImages.map((src, i) => `
        <div class="media-grid-item">
          <img src="${src}" alt="Content ${i + 1}"/>
          ${locked ? `
            <div class="locked-overlay">
              <i data-lucide="lock" class="h-6 w-6 text-white"></i>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// Page rendering functions
async function renderFeedPage() {
  const postsContainer = document.getElementById('posts-container');
  const suggestedContainer = document.getElementById('suggested-creators');
  
  // Show loading
  postsContainer.innerHTML = '<div class="loading-spinner"></div>';
  
  // Load content
  App.content = await fetchContent();
  App.creators = await fetchCreators();
  
  // Render posts
  if (App.content.length === 0) {
    postsContainer.innerHTML = `
      <div class="text-center py-12">
        <i data-lucide="image" class="h-12 w-12 text-gray-400 mx-auto mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
        <p class="text-gray-600 mb-4">Be the first to create some amazing content!</p>
        <button onclick="openUploadModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
          Create Post
        </button>
      </div>
    `;
  } else {
    postsContainer.innerHTML = App.content.map(post => renderPostCard(post)).join('');
  }
  
  // Render suggested creators
  suggestedContainer.innerHTML = App.creators.slice(0, 4).map(creator => renderCreatorCard(creator, true)).join('');
  
  // Re-initialize Lucide icons
  lucide.createIcons();
}

async function renderDiscoverPage() {
  const container = document.getElementById('discover-creators');
  
  // Show loading
  container.innerHTML = '<div class="loading-spinner"></div>';
  
  // Load creators if not already loaded
  if (App.creators.length === 0) {
    App.creators = await fetchCreators();
  }
  
  // Render creators
  container.innerHTML = App.creators.map(creator => renderCreatorCard(creator)).join('');
  
  // Re-initialize Lucide icons
  lucide.createIcons();
}

function renderProfilePage() {
  const creator = App.currentCreator || App.creators[0];
  if (!creator) return;
  
  const headerContainer = document.getElementById('profile-header');
  const contentContainer = document.getElementById('profile-content');
  const paywallBanner = document.getElementById('paywall-banner');
  
  // Render profile header
  headerContainer.innerHTML = renderProfileHeader(creator);
  
  // Show paywall for premium content
  paywallBanner.classList.remove('hidden');
  
  // Render media grid (locked by default)
  contentContainer.innerHTML = renderMediaGrid(true);
  
  // Re-initialize Lucide icons
  lucide.createIcons();
}

function renderMessagesPage() {
  // Messages are static for this demo
  // In a real app, you'd load messages from the API
}

function renderSettingsPage() {
  // Settings are static for this demo
  // In a real app, you'd load user settings from the API
}

// Navigation functions
function navigateToPage(page) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
  
  // Show selected page
  document.getElementById(`${page}-page`).classList.remove('hidden');
  
  // Update navigation states
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll(`[data-page="${page}"]`).forEach(btn => btn.classList.add('active'));
  
  // Update app state
  App.currentPage = page;
  
  // Render page content
  switch(page) {
    case 'feed':
      renderFeedPage();
      break;
    case 'discover':
      renderDiscoverPage();
      break;
    case 'profile':
      renderProfilePage();
      break;
    case 'messages':
      renderMessagesPage();
      break;
    case 'settings':
      renderSettingsPage();
      break;
  }
  
  // Close mobile sidebar
  closeSidebar();
}

// Modal functions
function openSubscribeModal() {
  document.getElementById('subscribe-modal').classList.add('show');
  document.getElementById('subscribe-modal').style.display = 'grid';
}

function closeSubscribeModal() {
  document.getElementById('subscribe-modal').classList.remove('show');
  document.getElementById('subscribe-modal').style.display = 'none';
}

function openTipModal() {
  document.getElementById('tip-modal').classList.add('show');
  document.getElementById('tip-modal').style.display = 'grid';
}

function closeTipModal() {
  document.getElementById('tip-modal').classList.remove('show');
  document.getElementById('tip-modal').style.display = 'none';
  App.selectedTipAmount = null;
  // Reset tip amount buttons
  document.querySelectorAll('.tip-amount-btn').forEach(btn => btn.classList.remove('selected'));
}

function openUploadModal() {
  document.getElementById('upload-modal').classList.add('show');
  document.getElementById('upload-modal').style.display = 'grid';
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('show');
  document.getElementById('upload-modal').style.display = 'none';
  // Reset form
  document.getElementById('upload-form').reset();
  App.uploadedFiles = [];
  updateFilePreview();
}

// Sidebar functions
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.add('sidebar-mobile-open');
  overlay.classList.add('show');
  overlay.classList.remove('hidden');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('sidebar-mobile-open');
  overlay.classList.remove('show');
  overlay.classList.add('hidden');
}

// Interaction functions
function toggleLike(postId) {
  if (App.likedPosts.has(postId)) {
    App.likedPosts.delete(postId);
  } else {
    App.likedPosts.add(postId);
  }
  
  // Update the like button
  const likeBtn = document.querySelector(`[onclick="toggleLike('${postId}')"]`);
  if (likeBtn) {
    const isLiked = App.likedPosts.has(postId);
    likeBtn.className = `like-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border ${isLiked ? 'liked' : 'hover:bg-gray-50'}`;
    likeBtn.innerHTML = `<i data-lucide="heart" class="h-4 w-4"></i>${isLiked ? 'Liked' : 'Like'}`;
    lucide.createIcons();
  }
}

function openCreatorProfile(creatorId) {
  App.currentCreator = App.creators.find(c => c.id === creatorId);
  navigateToPage('profile');
}

function selectTipAmount(amount) {
  App.selectedTipAmount = amount;
  document.querySelectorAll('.tip-amount-btn').forEach(btn => btn.classList.remove('selected'));
  document.querySelector(`[data-amount="${amount}"]`).classList.add('selected');
  document.getElementById('custom-tip-amount').value = '';
}

// File upload functions
function updateFilePreview() {
  const preview = document.getElementById('file-preview');
  if (App.uploadedFiles.length === 0) {
    preview.classList.add('hidden');
    return;
  }
  
  preview.classList.remove('hidden');
  preview.innerHTML = App.uploadedFiles.map((file, index) => `
    <div class="file-preview-item">
      ${file.type.startsWith('image/') ? 
        `<img src="${file.url}" alt="${file.name}"/>` :
        `<video src="${file.url}" muted></video>`
      }
      <button type="button" class="file-preview-remove" onclick="removeFile(${index})">×</button>
    </div>
  `).join('');
}

function removeFile(index) {
  App.uploadedFiles.splice(index, 1);
  updateFilePreview();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      App.uploadedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        url: e.target.result,
        file: file
      });
      updateFilePreview();
    };
    reader.readAsDataURL(file);
  });
}

async function handleUploadSubmit(event) {
  event.preventDefault();
  
  const formData = {
    title: document.getElementById('post-title').value,
    description: document.getElementById('post-description').value,
    content_type: document.getElementById('content-type').value,
    media_files: App.uploadedFiles.map(f => f.url), // In real app, upload files first
    is_free: document.querySelector('input[name="pricing"]:checked').value === 'free',
    price: document.querySelector('input[name="pricing"]:checked').value === 'paid' ? 
           parseFloat(document.getElementById('ppv-price').value) : null,
    subscription_only: document.querySelector('input[name="pricing"]:checked').value === 'subscription',
    tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t)
  };
  
  try {
    const result = await uploadContent(formData);
    if (result.success) {
      showSuccessMessage('Post created successfully!');
      closeUploadModal();
      navigateToPage('feed'); // Refresh feed to show new post
    }
  } catch (error) {
    showErrorMessage('Failed to create post. Please try again.');
  }
}

function showSuccessMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'success-message';
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

function showErrorMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'error-message';
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

// Tab switching for profile
function switchProfileTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  
  const contentContainer = document.getElementById('profile-content');
  
  switch(tab) {
    case 'posts':
      contentContainer.innerHTML = renderMediaGrid(true);
      break;
    case 'videos':
      contentContainer.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          ${Array.from({length: 6}, (_, i) => `
            <div class="relative">
              <img src="https://picsum.photos/300/200?random=${i + 20}" class="w-full aspect-video object-cover rounded-xl"/>
              <button class="absolute inset-0 grid place-items-center">
                <span class="p-3 rounded-full bg-black/40">
                  <i data-lucide="play" class="h-6 w-6 text-white"></i>
                </span>
              </button>
              <div class="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                00:${(i+1)*7}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      break;
    case 'likes':
      contentContainer.innerHTML = '<div class="text-sm text-gray-600">Likes are private.</div>';
      break;
  }
  
  lucide.createIcons();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Navigation event listeners
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateToPage(btn.dataset.page));
  });
  
  // Sidebar toggle
  document.getElementById('toggle-sidebar').addEventListener('click', openSidebar);
  document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
  
  // Create post buttons
  document.getElementById('create-post-btn').addEventListener('click', openUploadModal);
  document.getElementById('create-post-sidebar').addEventListener('click', openUploadModal);
  
  // Upload form
  document.getElementById('upload-form').addEventListener('submit', handleUploadSubmit);
  document.getElementById('media-file').addEventListener('change', handleFileSelect);
  
  // Pricing radio buttons
  document.querySelectorAll('input[name="pricing"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const ppvPrice = document.getElementById('ppv-price');
      ppvPrice.disabled = this.value !== 'paid';
      if (this.value === 'paid') {
        ppvPrice.focus();
      }
    });
  });
  
  // Tip amount selection
  document.querySelectorAll('.tip-amount-btn').forEach(btn => {
    btn.addEventListener('click', () => selectTipAmount(btn.dataset.amount));
  });
  
  // Custom tip amount
  document.getElementById('custom-tip-amount').addEventListener('input', function() {
    if (this.value) {
      document.querySelectorAll('.tip-amount-btn').forEach(btn => btn.classList.remove('selected'));
      App.selectedTipAmount = parseFloat(this.value);
    }
  });
  
  // Send tip
  document.getElementById('send-tip').addEventListener('click', function() {
    const amount = App.selectedTipAmount || parseFloat(document.getElementById('custom-tip-amount').value);
    if (amount && amount > 0) {
      showSuccessMessage(`Tip of $${amount.toFixed(2)} sent successfully!`);
      closeTipModal();
    } else {
      showErrorMessage('Please select or enter a valid tip amount.');
    }
  });
  
  // Subscription
  document.getElementById('confirm-subscription').addEventListener('click', function() {
    const plan = document.getElementById('subscription-plan').value;
    showSuccessMessage('Subscription activated successfully!');
    closeSubscribeModal();
  });
  
  // Profile tabs
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchProfileTab(btn.dataset.tab));
  });
  
  // Search functionality
  let searchTimeout;
  document.getElementById('search-input').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      // Implement search functionality here
      console.log('Searching for:', this.value);
    }, 300);
  });
  
  // Message sending
  document.getElementById('send-message').addEventListener('click', function() {
    const input = document.getElementById('message-input');
    if (input.value.trim()) {
      // Add message to chat (simplified)
      console.log('Sending message:', input.value);
      input.value = '';
    }
  });
  
  // Initialize the app with feed page
  navigateToPage('feed');
});

// Global functions for inline event handlers
window.openSubscribeModal = openSubscribeModal;
window.closeSubscribeModal = closeSubscribeModal;
window.openTipModal = openTipModal;
window.closeTipModal = closeTipModal;
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.toggleLike = toggleLike;
window.openCreatorProfile = openCreatorProfile;
window.selectTipAmount = selectTipAmount;