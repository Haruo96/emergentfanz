// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global State
let currentUser = null;
let authToken = null;
let currentPage = 'home';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize Application
function initializeApp() {
    // Check for stored auth token
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        getCurrentUser();
    }
    
    // Load initial content
    loadPage('home');
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            loadPage(page);
        });
    });

    // Auth buttons
    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => openModal('register-modal'));
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Modal controls
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Modal switching
    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login-modal');
        openModal('register-modal');
    });

    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('register-modal');
        openModal('login-modal');
    });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('create-post-form').addEventListener('submit', handleCreatePost);

    // Role selection
    document.getElementById('register-role').addEventListener('change', (e) => {
        const subscriptionGroup = document.getElementById('subscription-price-group');
        if (e.target.value === 'creator') {
            subscriptionGroup.style.display = 'block';
        } else {
            subscriptionGroup.style.display = 'none';
        }
    });

    // Profile actions
    document.getElementById('create-post-btn').addEventListener('click', () => openModal('create-post-modal'));
    document.getElementById('edit-profile-btn').addEventListener('click', editProfile);

    // Search
    document.getElementById('creator-search').addEventListener('input', debounce(searchCreators, 300));

    // File preview
    document.getElementById('post-media').addEventListener('change', previewFiles);

    // Explore button
    document.getElementById('explore-btn').addEventListener('click', () => loadPage('creators'));

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Subscribe actions
    document.getElementById('confirm-subscribe').addEventListener('click', handleSubscribe);

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            closeModal('login-modal');
            updateAuthUI();
            showToast('Login successful!', 'success');
            loadPage('home');
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const bio = document.getElementById('register-bio').value;
    const subscriptionPrice = document.getElementById('register-subscription-price').value;

    const userData = {
        username,
        email,
        password,
        role,
        bio
    };

    if (role === 'creator' && subscriptionPrice) {
        userData.subscriptionPrice = parseFloat(subscriptionPrice);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            closeModal('register-modal');
            updateAuthUI();
            showToast('Registration successful!', 'success');
            loadPage('home');
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthUI();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Get user error:', error);
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
    loadPage('home');
    showToast('Logged out successfully', 'success');
}

function checkAuthStatus() {
    updateAuthUI();
}

function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenu = document.getElementById('user-menu');
    const createPostBtn = document.getElementById('create-post-btn');
    const subscribersTab = document.getElementById('subscribers-tab');

    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        
        const userAvatar = document.getElementById('user-avatar');
        userAvatar.src = currentUser.profilePic || `https://ui-avatars.com/api/?name=${currentUser.username}&background=667eea&color=fff`;

        // Show creator-specific elements
        if (currentUser.role === 'creator') {
            createPostBtn.style.display = 'block';
            subscribersTab.style.display = 'block';
        }
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userMenu.style.display = 'none';
        createPostBtn.style.display = 'none';
        subscribersTab.style.display = 'none';
    }
}

// Page Navigation
function loadPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Show selected page
    document.getElementById(`${page}-page`).style.display = 'block';
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });

    currentPage = page;

    // Load page content
    switch (page) {
        case 'home':
            loadPosts();
            break;
        case 'creators':
            loadCreators();
            break;
        case 'subscriptions':
            loadSubscriptions();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Content Loading Functions
async function loadPosts() {
    const container = document.getElementById('posts-container');
    const loading = document.getElementById('posts-loading');
    
    loading.style.display = 'block';
    container.innerHTML = '';

    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/posts`, { headers });
        
        if (response.ok) {
            const data = await response.json();
            displayPosts(data.posts);
        } else if (response.status === 401) {
            // Not authenticated, show public posts or message
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                    <h3>Welcome to ContentVault</h3>
                    <p>Please log in to see posts from creators you follow</p>
                    <button class="btn btn-primary" onclick="openModal('login-modal')">Login</button>
                </div>
            `;
        } else {
            throw new Error('Failed to load posts');
        }
    } catch (error) {
        console.error('Load posts error:', error);
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                <p>Error loading posts. Please try again.</p>
            </div>
        `;
    } finally {
        loading.style.display = 'none';
    }
}

function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                <h3>No posts yet</h3>
                <p>Follow some creators to see their posts here!</p>
                <button class="btn btn-primary" onclick="loadPage('creators')">Discover Creators</button>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="post-card" onclick="openPost('${post._id}')">
            <div class="post-header">
                <img src="${post.creatorId.profilePic || `https://ui-avatars.com/api/?name=${post.creatorId.username}&background=667eea&color=fff`}" 
                     alt="${post.creatorId.username}" class="creator-avatar">
                <div class="creator-info">
                    <h3>${post.creatorId.username}</h3>
                    <p>@${post.creatorId.username}</p>
                </div>
                ${!post.isPublic ? '<div class="subscription-badge">Premium</div>' : ''}
            </div>
            ${post.mediaURL && post.mediaURL.length > 0 ? `
                <div class="post-image-container ${!post.isPublic ? 'locked-overlay' : ''}">
                    <img src="${API_BASE_URL.replace('/api', '')}${post.mediaURL[0]}" alt="${post.title}" class="post-image">
                    ${!post.isPublic ? '<div class="lock-icon"><i class="fas fa-lock"></i></div>' : ''}
                </div>
            ` : ''}
            <div class="post-body">
                <h3 class="post-title">${post.title}</h3>
                <p class="post-content">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="post-stats">
                    <span><i class="fas fa-heart"></i> ${post.likes ? post.likes.length : 0}</span>
                    <span><i class="fas fa-comment"></i> ${post.comments ? post.comments.length : 0}</span>
                    <span><i class="fas fa-eye"></i> ${post.viewCount || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadCreators() {
    const container = document.getElementById('creators-container');
    const loading = document.getElementById('creators-loading');
    
    loading.style.display = 'block';
    container.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/users/creators`);
        
        if (response.ok) {
            const data = await response.json();
            displayCreators(data.creators);
        } else {
            throw new Error('Failed to load creators');
        }
    } catch (error) {
        console.error('Load creators error:', error);
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                <p>Error loading creators. Please try again.</p>
            </div>
        `;
    } finally {
        loading.style.display = 'none';
    }
}

function displayCreators(creators) {
    const container = document.getElementById('creators-container');
    
    if (creators.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                <h3>No creators found</h3>
                <p>Be the first to join as a creator!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = creators.map(creator => `
        <div class="creator-card" onclick="viewCreatorProfile('${creator._id}')">
            <div class="creator-cover"></div>
            <div class="creator-profile">
                <img src="${creator.profilePic || `https://ui-avatars.com/api/?name=${creator.username}&background=667eea&color=fff`}" 
                     alt="${creator.username}" class="creator-avatar">
                <h3 class="creator-name">${creator.username}</h3>
                <p class="creator-username">@${creator.username}</p>
                <p class="creator-bio">${creator.bio || 'Content creator'}</p>
                <div class="creator-stats">
                    <div class="stat">
                        <div class="stat-number">${creator.subscriberCount || 0}</div>
                        <div class="stat-label">Subscribers</div>
                    </div>
                </div>
                ${creator.subscriptionPrice > 0 ? `
                    <div class="subscription-price">
                        <div class="price">$${creator.subscriptionPrice}/month</div>
                    </div>
                ` : ''}
                <div class="creator-actions">
                    <button class="btn btn-outline" onclick="event.stopPropagation(); followCreator('${creator._id}')">Follow</button>
                    ${creator.subscriptionPrice > 0 ? `
                        <button class="btn btn-primary" onclick="event.stopPropagation(); openSubscribeModal('${creator._id}')">Subscribe</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function loadSubscriptions() {
    if (!currentUser) {
        document.getElementById('subscriptions-container').innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                <h3>Please log in</h3>
                <p>You need to be logged in to view your subscriptions</p>
                <button class="btn btn-primary" onclick="openModal('login-modal')">Login</button>
            </div>
        `;
        return;
    }

    const container = document.getElementById('subscriptions-container');
    
    try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/my-subscriptions`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displaySubscriptions(data.subscriptions);
        } else {
            throw new Error('Failed to load subscriptions');
        }
    } catch (error) {
        console.error('Load subscriptions error:', error);
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                <p>Error loading subscriptions. Please try again.</p>
            </div>
        `;
    }
}

function displaySubscriptions(subscriptions) {
    const container = document.getElementById('subscriptions-container');
    
    if (subscriptions.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; color: white; padding: 2rem;">
                <h3>No subscriptions yet</h3>
                <p>Subscribe to creators to see their exclusive content</p>
                <button class="btn btn-primary" onclick="loadPage('creators')">Discover Creators</button>
            </div>
        `;
        return;
    }

    container.innerHTML = subscriptions.map(sub => `
        <div class="creator-card">
            <div class="creator-cover"></div>
            <div class="creator-profile">
                <img src="${sub.creatorId.profilePic || `https://ui-avatars.com/api/?name=${sub.creatorId.username}&background=667eea&color=fff`}" 
                     alt="${sub.creatorId.username}" class="creator-avatar">
                <h3 class="creator-name">${sub.creatorId.username}</h3>
                <p class="creator-username">@${sub.creatorId.username}</p>
                <p class="creator-bio">${sub.creatorId.bio || 'Content creator'}</p>
                <div class="subscription-price">
                    <div class="price">$${sub.amount}/month</div>
                    <small>Expires: ${new Date(sub.endDate).toLocaleDateString()}</small>
                </div>
                <div class="creator-actions">
                    <button class="btn btn-outline" onclick="viewCreatorProfile('${sub.creatorId._id}')">View Profile</button>
                    <button class="btn btn-outline" onclick="cancelSubscription('${sub._id}')">Cancel</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadProfile() {
    if (!currentUser) {
        document.getElementById('profile-page').innerHTML = `
            <div class="text-center" style="color: white; padding: 2rem;">
                <h3>Please log in</h3>
                <p>You need to be logged in to view your profile</p>
                <button class="btn btn-primary" onclick="openModal('login-modal')">Login</button>
            </div>
        `;
        return;
    }

    // Update profile info
    document.getElementById('profile-avatar').src = currentUser.profilePic || `https://ui-avatars.com/api/?name=${currentUser.username}&background=667eea&color=fff`;
    document.getElementById('profile-username').textContent = currentUser.username;
    document.getElementById('profile-bio').textContent = currentUser.bio || 'No bio yet';

    // Load user stats and posts
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser._id}`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('profile-posts').textContent = `${data.stats.postCount} Posts`;
            document.getElementById('profile-subscribers').textContent = `${data.user.subscriberCount || 0} Subscribers`;
        }
    } catch (error) {
        console.error('Load profile stats error:', error);
    }

    // Load user's posts
    loadUserPosts();
}

async function loadUserPosts() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/posts/creator/${currentUser._id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayUserPosts(data.posts);
        }
    } catch (error) {
        console.error('Load user posts error:', error);
    }
}

function displayUserPosts(posts) {
    const container = document.getElementById('profile-posts');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="color: white; padding: 2rem;">
                <h3>No posts yet</h3>
                <p>Create your first post to get started!</p>
                ${currentUser && currentUser.role === 'creator' ? `
                    <button class="btn btn-primary" onclick="openModal('create-post-modal')">Create Post</button>
                ` : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="posts-grid">
            ${posts.map(post => `
                <div class="post-card" onclick="openPost('${post._id}')">
                    ${post.mediaURL && post.mediaURL.length > 0 ? `
                        <img src="${API_BASE_URL.replace('/api', '')}${post.mediaURL[0]}" alt="${post.title}" class="post-image">
                    ` : ''}
                    <div class="post-body">
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-content">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                        <div class="post-stats">
                            <span><i class="fas fa-heart"></i> ${post.likes ? post.likes.length : 0}</span>
                            <span><i class="fas fa-comment"></i> ${post.comments ? post.comments.length : 0}</span>
                            <span><i class="fas fa-eye"></i> ${post.viewCount || 0}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Post Functions
async function handleCreatePost(e) {
    e.preventDefault();
    
    if (!currentUser || currentUser.role !== 'creator') {
        showToast('Only creators can create posts', 'error');
        return;
    }

    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const isPublic = document.getElementById('post-public').checked;
    const tags = document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const mediaFiles = document.getElementById('post-media').files;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('isPublic', isPublic);
    formData.append('tags', JSON.stringify(tags));

    // Add media files
    for (let i = 0; i < mediaFiles.length; i++) {
        formData.append('media', mediaFiles[i]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            closeModal('create-post-modal');
            document.getElementById('create-post-form').reset();
            document.getElementById('file-preview').innerHTML = '';
            showToast('Post created successfully!', 'success');
            
            // Refresh current page
            if (currentPage === 'home') {
                loadPosts();
            } else if (currentPage === 'profile') {
                loadUserPosts();
            }
        } else {
            showToast(data.error || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Create post error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function openPost(postId) {
    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, { headers });
        const data = await response.json();

        if (response.ok) {
            displayPostModal(data.post);
        } else if (response.status === 403 && data.requiresSubscription) {
            displaySubscriptionRequired(data.creator);
        } else {
            showToast(data.error || 'Failed to load post', 'error');
        }
    } catch (error) {
        console.error('Open post error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

function displayPostModal(post) {
    document.getElementById('post-modal-title').textContent = post.title;
    document.getElementById('post-creator-avatar').src = post.creatorId.profilePic || `https://ui-avatars.com/api/?name=${post.creatorId.username}&background=667eea&color=fff`;
    document.getElementById('post-creator-name').textContent = post.creatorId.username;
    document.getElementById('post-creator-username').textContent = `@${post.creatorId.username}`;
    document.getElementById('post-modal-content').textContent = post.content;
    document.getElementById('like-count').textContent = post.likes ? post.likes.length : 0;

    // Display media
    const mediaContainer = document.getElementById('post-media');
    if (post.mediaURL && post.mediaURL.length > 0) {
        mediaContainer.innerHTML = post.mediaURL.map(url => {
            const fullUrl = `${API_BASE_URL.replace('/api', '')}${url}`;
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return `<img src="${fullUrl}" alt="${post.title}" style="width: 100%; border-radius: 10px; margin-bottom: 1rem;">`;
            } else if (url.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
                return `<video src="${fullUrl}" controls style="width: 100%; border-radius: 10px; margin-bottom: 1rem;"></video>`;
            }
            return '';
        }).join('');
    } else {
        mediaContainer.innerHTML = '';
    }

    document.getElementById('subscription-required').style.display = 'none';
    openModal('post-modal');
}

function displaySubscriptionRequired(creator) {
    document.getElementById('post-modal-title').textContent = 'Subscription Required';
    document.getElementById('post-creator-avatar').src = creator.profilePic || `https://ui-avatars.com/api/?name=${creator.username}&background=667eea&color=fff`;
    document.getElementById('post-creator-name').textContent = creator.username;
    document.getElementById('post-creator-username').textContent = `@${creator.username}`;
    document.getElementById('post-modal-content').textContent = '';
    document.getElementById('post-media').innerHTML = '';
    
    document.getElementById('subscription-required').style.display = 'block';
    document.getElementById('subscribe-btn').onclick = () => openSubscribeModal(creator._id);
    
    openModal('post-modal');
}

// Subscription Functions
async function openSubscribeModal(creatorId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${creatorId}`);
        const data = await response.json();

        if (response.ok) {
            const creator = data.user;
            document.getElementById('subscribe-creator-avatar').src = creator.profilePic || `https://ui-avatars.com/api/?name=${creator.username}&background=667eea&color=fff`;
            document.getElementById('subscribe-creator-name').textContent = creator.username;
            document.getElementById('subscribe-creator-username').textContent = `@${creator.username}`;
            document.getElementById('subscribe-price').textContent = `$${creator.subscriptionPrice}/month`;
            
            // Store creator ID for subscription
            document.getElementById('confirm-subscribe').setAttribute('data-creator-id', creatorId);
            
            closeModal('post-modal');
            openModal('subscribe-modal');
        }
    } catch (error) {
        console.error('Load creator error:', error);
        showToast('Error loading creator information', 'error');
    }
}

async function handleSubscribe() {
    if (!currentUser) {
        showToast('Please log in to subscribe', 'error');
        return;
    }

    const creatorId = document.getElementById('confirm-subscribe').getAttribute('data-creator-id');
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                creatorId,
                paymentDetails: { method: paymentMethod }
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeModal('subscribe-modal');
            showToast('Subscription successful!', 'success');
            
            // Refresh subscriptions if on that page
            if (currentPage === 'subscriptions') {
                loadSubscriptions();
            }
        } else {
            showToast(data.error || 'Subscription failed', 'error');
        }
    } catch (error) {
        console.error('Subscribe error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function cancelSubscription(subscriptionId) {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/cancel/${subscriptionId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Subscription cancelled', 'success');
            loadSubscriptions();
        } else {
            showToast(data.error || 'Failed to cancel subscription', 'error');
        }
    } catch (error) {
        console.error('Cancel subscription error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Utility Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function previewFiles() {
    const files = document.getElementById('post-media').files;
    const preview = document.getElementById('file-preview');
    preview.innerHTML = '';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const element = document.createElement(file.type.startsWith('image/') ? 'img' : 'video');
            element.src = e.target.result;
            if (element.tagName === 'VIDEO') {
                element.controls = true;
            }
            preview.appendChild(element);
        };
        
        reader.readAsDataURL(file);
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Load tab content
    switch (tab) {
        case 'posts':
            loadUserPosts();
            break;
        case 'subscribers':
            loadSubscribers();
            break;
    }
}

async function loadSubscribers() {
    if (!currentUser || currentUser.role !== 'creator') return;

    try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/my-subscribers`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displaySubscribers(data.subscribers);
        }
    } catch (error) {
        console.error('Load subscribers error:', error);
    }
}

function displaySubscribers(subscribers) {
    const container = document.getElementById('profile-posts');
    
    if (subscribers.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="color: white; padding: 2rem;">
                <h3>No subscribers yet</h3>
                <p>Share your profile to get your first subscribers!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="subscribers-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
            ${subscribers.map(sub => `
                <div class="subscriber-card" style="background: white; padding: 1rem; border-radius: 10px; text-align: center;">
                    <img src="${sub.fanId.profilePic || `https://ui-avatars.com/api/?name=${sub.fanId.username}&background=667eea&color=fff`}" 
                         alt="${sub.fanId.username}" style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 0.5rem;">
                    <h4>${sub.fanId.username}</h4>
                    <p style="font-size: 0.8rem; color: #666;">Subscribed: ${new Date(sub.createdAt).toLocaleDateString()}</p>
                </div>
            `).join('')}
        </div>
    `;
}

async function searchCreators() {
    const query = document.getElementById('creator-search').value;
    const container = document.getElementById('creators-container');
    
    if (!query.trim()) {
        loadCreators();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/creators?search=${encodeURIComponent(query)}`);
        
        if (response.ok) {
            const data = await response.json();
            displayCreators(data.creators);
        }
    } catch (error) {
        console.error('Search creators error:', error);
    }
}

function viewCreatorProfile(creatorId) {
    // For now, just show a message. In a full app, this would navigate to the creator's profile page
    showToast('Creator profile view - feature coming soon!', 'info');
}

function followCreator(creatorId) {
    // Placeholder for follow functionality
    showToast('Follow feature - coming soon!', 'info');
}

function editProfile() {
    // Placeholder for profile editing
    showToast('Profile editing - coming soon!', 'info');
}