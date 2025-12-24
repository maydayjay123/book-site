// Authentication System

// Initialize default admin account
function initializeDefaultAdmin() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
        const defaultAdmin = {
            id: Date.now(),
            username: 'admin',
            displayName: 'Administrator',
            password: btoa('admin123'),
            isAdmin: true,
            createdAt: new Date().toISOString()
        };
        users.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Default admin created - Username: admin, Password: admin123');
    }
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username);
    
    if (!user) {
        showError('User not found');
        return;
    }
    
    if (atob(user.password) !== password) {
        showError('Incorrect password');
        return;
    }
    
    // Set session
    sessionStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin
    }));
    
    window.location.href = 'home.html';
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => errorDiv.classList.remove('show'), 3000);
}

// Logout
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Check authentication
function requireAuth() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Check admin
function requireAdmin() {
    const user = requireAuth();
    if (!user || !user.isAdmin) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'home.html';
        return null;
    }
    return user;
}

// Dark mode toggle
document.getElementById('darkModeToggle')?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});


function initUserDisplay() {
    const currentUser = requireAuth();
    if (currentUser) {
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.textContent = currentUser.displayName;
        }
        
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn && currentUser.isAdmin) {
            adminBtn.style.display = 'inline-block';
            adminBtn.onclick = () => window.location.href = 'admin.html';
        }
    }
}

// Run on pages that need auth
if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('index.html')) {
    initUserDisplay();
}

// Initialize
initializeDefaultAdmin();
