// Dashboard

// Check authentication
const currentUser = requireAuth();

// User data management
let userData = getUserData();
let currentView = 'all';
let editingBookId = null;

// DOM elements
const userDisplay = document.getElementById('userDisplay');
const darkModeToggle = document.getElementById('darkModeToggle');
const addBookBtn = document.getElementById('addBookBtn');
const bookModal = document.getElementById('bookModal');
const challengeModal = document.getElementById('challengeModal');
const settingsModal = document.getElementById('settingsModal');
const bookForm = document.getElementById('bookForm');
const challengeForm = document.getElementById('challengeForm');
const booksGrid = document.getElementById('booksGrid');
const currentlyReadingList = document.getElementById('currentlyReadingList');
const adminBtn = document.getElementById('adminBtn');
const settingsBtn = document.getElementById('settingsBtn');

// Initialize
userDisplay.textContent = currentUser.displayName;

// Show admin button if user is admin
console.log('Current user:', currentUser);
console.log('Is admin?', currentUser.isAdmin);

if (currentUser.isAdmin === true) {
    adminBtn.style.display = 'inline-block';
    adminBtn.onclick = () => window.location.href = 'admin.html';
    console.log('Admin button shown');
}

// Get user data
function getUserData() {
    const data = localStorage.getItem(`userData_${currentUser.id}`);
    const userBooks = JSON.parse(localStorage.getItem(`userBooks_${currentUser.id}`) || '[]');
    if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(userBooks) && userBooks.length > 0) {
            if (Array.isArray(parsed.books) && parsed.books.length > 0) {
                const legacyById = new Map(parsed.books.map((book) => [book.id, book]));
                let updated = false;
                const mergedUserBooks = userBooks.map((book) => {
                    const legacy = legacyById.get(book.id);
                    if (!legacy) {
                        return book;
                    }
                    const merged = { ...legacy, ...book };
                    if (!merged.status && legacy.status) {
                        merged.status = legacy.status;
                        updated = true;
                    }
                    if ((!Array.isArray(merged.statuses) || merged.statuses.length === 0) && Array.isArray(legacy.statuses) && legacy.statuses.length > 0) {
                        merged.statuses = [...legacy.statuses];
                        updated = true;
                    }
                    return merged;
                });
                const mergedIds = new Set(mergedUserBooks.map((book) => book.id));
                const legacyOnly = parsed.books.filter((book) => !mergedIds.has(book.id));
                parsed.books = mergedUserBooks.concat(legacyOnly);
                if (updated) {
                    localStorage.setItem(`userBooks_${currentUser.id}`, JSON.stringify(mergedUserBooks));
                }
            } else {
                parsed.books = userBooks;
            }
        }
        return parsed;
    }
    // Initialize default data
    const defaultData = {
        books: [],
        authors: {},
        readingChallenge: {
            year: 2026,
            goal: 20,
            completed: 0
        }
    };
    if (Array.isArray(userBooks) && userBooks.length > 0) {
        defaultData.books = userBooks;
    }
    saveUserData(defaultData);
    return defaultData;
}

function saveUserData(data = userData) {
    localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(data));
}

// Dark mode
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
darkModeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    darkModeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Recreate charts with new theme
    if (monthlyChart) updateCharts();
});

// Settings modal
settingsBtn.addEventListener('click', () => {
    document.getElementById('settingsUsername').textContent = currentUser.username;
    document.getElementById('settingsDisplayName').textContent = currentUser.displayName;
    document.getElementById('changePasswordForm').reset();
    document.getElementById('settingsMessage').style.display = 'none';
    settingsModal.style.display = 'block';
});

document.getElementById('closeSettingsModal').addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

document.getElementById('cancelPasswordBtn').addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

// Change password
document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('settingsMessage');
    
    // Get all users
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) {
        messageDiv.textContent = 'User not found';
        messageDiv.className = 'settings-message error';
        return;
    }
    
    // Verify current password
    if (atob(users[userIndex].password) !== currentPassword) {
        messageDiv.textContent = 'Current password is incorrect';
        messageDiv.className = 'settings-message error';
        return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        messageDiv.textContent = 'New passwords do not match';
        messageDiv.className = 'settings-message error';
        return;
    }
    
    // Update password
    users[userIndex].password = btoa(newPassword);
    users[userIndex].mustChangePassword = false;
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update session
    const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
    sessionUser.mustChangePassword = false;
    sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
    
    messageDiv.textContent = 'Password updated successfully!';
    messageDiv.className = 'settings-message success';
    
    document.getElementById('changePasswordForm').reset();
    
    setTimeout(() => {
        settingsModal.style.display = 'none';
    }, 2000);
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        const view = item.dataset.view;
        currentView = view;
        
        if (view === 'authors') {
            document.querySelector('.books-section').style.display = 'none';
            document.querySelector('.authors-section').style.display = 'block';
            displayAuthors();
        } else {
            document.querySelector('.books-section').style.display = 'block';
            document.querySelector('.authors-section').style.display = 'none';
            displayBooks(view);
        }
    });
});

// Modal controls
addBookBtn.addEventListener('click', () => {
    editingBookId = null;
    bookForm.reset();
    document.getElementById('modalTitle').textContent = 'Add New Book';
    bookModal.style.display = 'block';
});

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    bookModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Add/Edit book
bookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const bookData = {
        id: editingBookId || Date.now(),
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        genre: document.getElementById('bookGenre').value,
        totalPages: parseInt(document.getElementById('bookPages').value),
        currentPage: parseInt(document.getElementById('currentPage').value) || 0,
        status: document.getElementById('bookStatus').value,
        rating: parseFloat(document.getElementById('bookRating').value) || null,
        review: document.getElementById('bookReview').value.trim(),
        dateFinished: document.getElementById('dateFinished').value || null,
        dateAdded: editingBookId ? userData.books.find(b => b.id === editingBookId).dateAdded : new Date().toISOString()
    };

    if (editingBookId) {
        const index = userData.books.findIndex(b => b.id === editingBookId);
        userData.books[index] = bookData;
    } else {
        userData.books.push(bookData);
    }

    saveUserData();
    displayBooks(currentView);
    displayCurrentlyReading();
    updateStatistics();
    updateChallenge();
    updateCharts();
    bookModal.style.display = 'none';
    bookForm.reset();
});

// Display books
function displayBooks(filter = 'all') {
    const sectionTitle = document.getElementById('sectionTitle');
    const titles = {
        'all': 'All Books',
        'reading': 'Currently Reading',
        'read': 'Read Books',
        'want-to-read': 'Want to Read'
    };
    sectionTitle.textContent = titles[filter] || 'All Books';
    
    const filteredBooks = filter === 'all' 
        ? userData.books 
        : userData.books.filter(book => book.status === filter);

    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state">
                <h3>No books found</h3>
                <p>Add your first book to get started!</p>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = filteredBooks.map(book => {
        const statusClass = book.status;
        const statusText = book.status === 'want-to-read' ? 'Want to Read' 
                         : book.status === 'reading' ? 'Reading' 
                         : 'Read';
        
        const ratingStars = book.rating 
            ? '⭐'.repeat(Math.floor(book.rating)) + (book.rating % 1 ? '½' : '')
            : '';

        const progress = book.status === 'reading' && book.totalPages > 0
            ? Math.round((book.currentPage / book.totalPages) * 100)
            : null;

        return `
            <div class="book-card" onclick="viewBook(${book.id})">
                <h3>${book.title}</h3>
                <p class="author">${book.author}</p>
                <span class="genre">${book.genre}</span>
                <br>
                <span class="status ${statusClass}">${statusText}</span>
                ${book.rating ? `<div class="rating">${ratingStars} ${book.rating}/5</div>` : ''}
                ${progress !== null ? `<p class="pages">${progress}% complete</p>` : ''}
                <p class="pages">${book.totalPages} pages</p>
            </div>
        `;
    }).join('');
}

// Display currently reading
function displayCurrentlyReading() {
    const readingBooks = userData.books.filter((book) => {
        if (book.statuses && Array.isArray(book.statuses)) {
            return book.statuses.includes('reading');
        }
        return book.status === 'reading';
    });
    
    if (readingBooks.length === 0) {
        currentlyReadingList.innerHTML = '<p style="color: var(--text-secondary);">No books currently being read</p>';
        return;
    }
    
    currentlyReadingList.innerHTML = readingBooks.map(book => {
        const progress = book.totalPages > 0 
            ? Math.round((book.currentPage / book.totalPages) * 100)
            : 0;
        
        return `
            <div class="reading-progress-card" onclick="viewBook(${book.id})">
                <h4>${book.title}</h4>
                <p class="author">by ${book.author}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
                <p class="progress-text">${book.currentPage} / ${book.totalPages} pages (${progress}%)</p>
            </div>
        `;
    }).join('');
}

// View book details
function viewBook(bookId) {
    window.location.href = `book-detail.html?id=${bookId}`;
}

// Edit book from card
function editBook(bookId) {
    event.stopPropagation();
    editingBookId = bookId;
    const book = userData.books.find(b => b.id === bookId);
    
    document.getElementById('modalTitle').textContent = 'Edit Book';
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookGenre').value = book.genre;
    document.getElementById('bookPages').value = book.totalPages;
    document.getElementById('currentPage').value = book.currentPage;
    document.getElementById('bookStatus').value = book.status;
    document.getElementById('bookRating').value = book.rating || '';
    document.getElementById('bookReview').value = book.review;
    document.getElementById('dateFinished').value = book.dateFinished || '';
    
    bookModal.style.display = 'block';
}

// Update statistics
function updateStatistics() {
    const totalBooks = userData.books.length;
    const readBooks = userData.books.filter(b => b.status === 'read');
    const totalPages = readBooks.reduce((sum, book) => sum + book.totalPages, 0);
    const avgRating = readBooks.length > 0 
        ? (readBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / readBooks.filter(b => b.rating).length).toFixed(1)
        : 0;
    
    document.getElementById('totalBooks').textContent = totalBooks;
    document.getElementById('booksRead').textContent = readBooks.length;
    document.getElementById('totalPages').textContent = totalPages.toLocaleString();
    document.getElementById('avgRating').textContent = avgRating || 'N/A';
}

// Update reading challenge
function updateChallenge() {
    const completed = userData.books.filter(b => b.status === 'read').length;
    const goal = userData.readingChallenge.goal;
    const percentage = Math.min(Math.round((completed / goal) * 100), 100);
    
    document.getElementById('challengeCount').textContent = completed;
    document.getElementById('challengeGoal').textContent = goal;
    document.getElementById('challengePercentage').textContent = `${percentage}%`;
    
    // Update circle progress
    const circle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

// Edit challenge goal
document.getElementById('editChallengeBtn').addEventListener('click', () => {
    document.getElementById('challengeGoalInput').value = userData.readingChallenge.goal;
    challengeModal.style.display = 'block';
});

challengeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userData.readingChallenge.goal = parseInt(document.getElementById('challengeGoalInput').value);
    saveUserData();
    updateChallenge();
    challengeModal.style.display = 'none';
});

document.getElementById('closeChallengeModal').addEventListener('click', () => {
    challengeModal.style.display = 'none';
});

document.getElementById('cancelChallengeBtn').addEventListener('click', () => {
    challengeModal.style.display = 'none';
});

// Charts
let monthlyChart, genreChart;

function updateCharts() {
    updateMonthlyChart();
    updateGenreChart();
}

function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Get books read in 2026 by month
    const monthlyData = Array(12).fill(0);
    userData.books.filter(b => b.status === 'read' && b.dateFinished).forEach(book => {
        const date = new Date(book.dateFinished);
        if (date.getFullYear() === 2026) {
            monthlyData[date.getMonth()] += book.totalPages;
        }
    });
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#2c3e50';
    const gridColor = isDark ? '#404040' : '#e0e0e0';
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Pages Read',
                data: monthlyData,
                backgroundColor: '#3498db',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function updateGenreChart() {
    const ctx = document.getElementById('genreChart').getContext('2d');
    
    // Count books by genre
    const genreCounts = {};
    userData.books.filter(b => b.status === 'read').forEach(book => {
        genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
    });
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#2c3e50';
    
    if (genreChart) {
        genreChart.destroy();
    }
    
    const labels = Object.keys(genreCounts);
    const data = Object.values(genreCounts);
    
    if (labels.length === 0) {
        labels.push('No Data');
        data.push(1);
    }
    
    genreChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3498db', '#e74c3c', '#f39c12', '#27ae60', 
                    '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
                    '#95a5a6', '#d35400', '#2ecc71'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        padding: 10,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// Display authors
function displayAuthors() {
    const authorsGrid = document.getElementById('authorsGrid');
    
    // Group books by author
    const authorBooks = {};
    userData.books.forEach(book => {
        if (!authorBooks[book.author]) {
            authorBooks[book.author] = [];
        }
        authorBooks[book.author].push(book);
    });
    
    const authors = Object.keys(authorBooks);
    
    if (authors.length === 0) {
        authorsGrid.innerHTML = '<div class="empty-state"><h3>No authors yet</h3></div>';
        return;
    }
    
    authorsGrid.innerHTML = authors.map(author => `
        <div class="author-card" onclick="viewAuthor('${author.replace(/'/g, "\\'")}')">
            <h3>✍️ ${author}</h3>
            <p class="book-count">${authorBooks[author].length} book${authorBooks[author].length !== 1 ? 's' : ''}</p>
        </div>
    `).join('');
}

function viewAuthor(author) {
    window.location.href = `author-detail.html?name=${encodeURIComponent(author)}`;
}

// Initialize
displayBooks('all');
displayCurrentlyReading();
updateStatistics();
updateChallenge();
updateCharts();
