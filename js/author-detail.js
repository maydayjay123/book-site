// Author Detail Page

// Check authentication
const currentUser = requireAuth();
const userData = getUserData();

// Get author name from URL
const urlParams = new URLSearchParams(window.location.search);
const authorName = decodeURIComponent(urlParams.get('name'));

if (!authorName) {
    alert('Author not found');
    window.location.href = 'dashboard.html';
}

// Get user data
function getUserData() {
    const data = localStorage.getItem(`userData_${currentUser.id}`);
    return data ? JSON.parse(data) : { books: [], authors: {} };
}

function saveUserData(data) {
    localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(data));
}

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

// Initialize authors object if it doesn't exist
if (!userData.authors) {
    userData.authors = {};
}

// Display author details
function displayAuthorDetails() {
    document.getElementById('authorName').textContent = authorName;
    document.getElementById('authorNameInModal').textContent = authorName;
    
    // Display notes
    const notesElement = document.getElementById('authorNotes');
    const authorNotes = userData.authors[authorName]?.notes || '';
    
    if (authorNotes) {
        notesElement.innerHTML = `<p>${authorNotes.replace(/\n/g, '<br>')}</p>`;
    } else {
        notesElement.innerHTML = '<p class="no-notes">No notes about this author yet</p>';
    }
    
    // Display books by this author
    const authorBooks = userData.books.filter(b => b.author === authorName);
    document.getElementById('bookCount').textContent = authorBooks.length;
    
    const booksList = document.getElementById('authorBooksList');
    
    if (authorBooks.length === 0) {
        booksList.innerHTML = '<div class="empty-state"><p>No books by this author yet</p></div>';
        return;
    }
    
    booksList.innerHTML = authorBooks.map(book => {
        const statusClass = book.status;
        const statusText = book.status === 'want-to-read' ? 'Want to Read' 
                         : book.status === 'reading' ? 'Reading' 
                         : 'Read';
        
        const ratingStars = book.rating 
            ? '⭐'.repeat(Math.floor(book.rating)) + (book.rating % 1 ? '½' : '')
            : '';

        return `
            <div class="book-card" onclick="viewBook(${book.id})">
                <h3>${book.title}</h3>
                <p class="author">${book.author}</p>
                <span class="genre">${book.genre}</span>
                <br>
                <span class="status ${statusClass}">${statusText}</span>
                ${book.rating ? `<div class="rating">${ratingStars} ${book.rating}/5</div>` : ''}
                <p class="pages">${book.totalPages} pages</p>
            </div>
        `;
    }).join('');
}

// View book
function viewBook(bookId) {
    window.location.href = `book-detail.html?id=${bookId}`;
}

// Edit author notes
const authorNotesModal = document.getElementById('authorNotesModal');
const editAuthorNotesBtn = document.getElementById('editAuthorNotesBtn');
const authorNotesForm = document.getElementById('authorNotesForm');
const cancelNotesBtn = document.getElementById('cancelNotesBtn');

editAuthorNotesBtn.addEventListener('click', () => {
    const currentNotes = userData.authors[authorName]?.notes || '';
    document.getElementById('authorNotesInput').value = currentNotes;
    authorNotesModal.style.display = 'block';
});

authorNotesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const notes = document.getElementById('authorNotesInput').value.trim();
    
    if (!userData.authors[authorName]) {
        userData.authors[authorName] = {};
    }
    
    userData.authors[authorName].notes = notes;
    saveUserData(userData);
    
    displayAuthorDetails();
    authorNotesModal.style.display = 'none';
});

cancelNotesBtn.addEventListener('click', () => {
    authorNotesModal.style.display = 'none';
});

document.querySelector('#authorNotesModal .close').addEventListener('click', () => {
    authorNotesModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === authorNotesModal) {
        authorNotesModal.style.display = 'none';
    }
});

function goBack() {
    window.location.href = 'dashboard.html';
}

// Initialize
displayAuthorDetails();
