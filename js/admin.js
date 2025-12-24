// Admin Panel

// Check admin access
const currentUser = requireAdmin();

// Dark mode
const darkModeToggle = document.getElementById('darkModeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
darkModeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    darkModeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// Display users
function displayUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<p style="color: var(--text-secondary);">No users yet</p>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">
                    ${user.displayName}
                    ${user.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                </div>
                <div class="user-username">@${user.username}</div>
            </div>
            ${user.username !== 'admin' ? `
                <button onclick="deleteUser(${user.id})" class="btn-danger" style="padding: 8px 16px; font-size: 0.9rem;">Delete</button>
            ` : ''}
        </div>
    `).join('');
}

// Create new user
document.getElementById('createUserForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value.toLowerCase().trim();
    const displayName = document.getElementById('newDisplayName').value.trim();
    const tempPassword = document.getElementById('tempPassword').value;
    const isAdmin = document.getElementById('isAdmin').checked;
    
    // Validate username
    if (!/^[a-z0-9_]+$/.test(username)) {
        alert('Username can only contain lowercase letters, numbers, and underscores');
        return;
    }
    
    // Check if username exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.username === username)) {
        alert('Username already exists');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        username: username,
        displayName: displayName,
        password: btoa(tempPassword), // Base64 encoded
        isAdmin: isAdmin,
        createdAt: new Date().toISOString(),
        mustChangePassword: true
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Initialize empty data for new user
    const userData = {
        books: [],
        authors: {},
        readingChallenge: {
            year: 2026,
            goal: 20,
            completed: 0
        }
    };
    localStorage.setItem(`userData_${newUser.id}`, JSON.stringify(userData));
    
    showMessage(`User "${displayName}" created successfully! Temporary password: ${tempPassword}`);
    displayUsers();
    this.reset();
});

// Delete user
function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? All their data will be lost.')) {
        return;
    }
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Delete user data
    localStorage.removeItem(`userData_${userId}`);
    
    showMessage('User deleted successfully');
    displayUsers();
}

function showMessage(message) {
    const messageDiv = document.getElementById('adminMessage');
    messageDiv.textContent = message;
    messageDiv.classList.add('success');
    setTimeout(() => {
        messageDiv.classList.remove('success');
    }, 3000);
}

// Initialize
displayUsers();
