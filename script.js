// Book storage
let books = JSON.parse(localStorage.getItem('books')) || [];
let editingBookId = null;

// DOM elements
const addBookBtn = document.getElementById('addBookBtn');
const bookModal = document.getElementById('bookModal');
const closeModal = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const bookForm = document.getElementById('bookForm');
const booksGrid = document.getElementById('booksGrid');
const filterBtns = document.querySelectorAll('.filter-btn');

// Modal controls
addBookBtn.addEventListener('click', () => {
    editingBookId = null;
    bookForm.reset();
    document.getElementById('modalTitle').textContent = 'Add New Book';
    bookModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    bookModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    bookModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === bookModal) {
        bookModal.style.display = 'none';
    }
});

// Form submission
bookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const bookData = {
        id: editingBookId || Date.now(),
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        status: document.getElementById('bookStatus').value,
        rating: document.getElementById('bookRating').value || null,
        notes: document.getElementById('bookNotes').value,
        dateAdded: editingBookId ? books.find(b => b.id === editingBookId).dateAdded : new Date().toISOString()
    };

    if (editingBookId) {
        const index = books.findIndex(b => b.id === editingBookId);
        books[index] = bookData;
    } else {
        books.push(bookData);
    }

    saveBooks();
    displayBooks();
    updateStats();
    bookModal.style.display = 'none';
    bookForm.reset();
});

// Filter books
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        displayBooks(filter);
    });
});

// Display books
function displayBooks(filter = 'all') {
    booksGrid.innerHTML = '';
    
    const filteredBooks = filter === 'all' 
        ? books 
        : books.filter(book => book.status === filter);

    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state">
                <h3>No books found</h3>
                <p>Add your first book to get started!</p>
            </div>
        `;
        return;
    }

    filteredBooks.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        const statusClass = book.status;
        const statusText = book.status === 'to-read' ? 'To Read' 
                         : book.status === 'reading' ? 'Currently Reading' 
                         : 'Completed';
        
        const ratingStars = book.rating 
            ? '⭐'.repeat(Math.floor(book.rating)) + (book.rating % 1 ? '½' : '')
            : '';

        bookCard.innerHTML = `
            <h3>${book.title}</h3>
            <p class="author">by ${book.author}</p>
            <span class="status ${statusClass}">${statusText}</span>
            ${book.rating ? `<div class="rating">${ratingStars} ${book.rating}/5</div>` : ''}
            ${book.notes ? `<p class="notes">${book.notes}</p>` : ''}
            <div class="actions">
                <button class="edit-btn" onclick="editBook(${book.id})">Edit</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">Delete</button>
            </div>
        `;
        
        booksGrid.appendChild(bookCard);
    });
}

// Edit book
function editBook(id) {
    editingBookId = id;
    const book = books.find(b => b.id === id);
    
    document.getElementById('modalTitle').textContent = 'Edit Book';
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookStatus').value = book.status;
    document.getElementById('bookRating').value = book.rating || '';
    document.getElementById('bookNotes').value = book.notes;
    
    bookModal.style.display = 'block';
}

// Delete book
function deleteBook(id) {
    if (confirm('Are you sure you want to delete this book?')) {
        books = books.filter(b => b.id !== id);
        saveBooks();
        displayBooks();
        updateStats();
    }
}

// Update statistics
function updateStats() {
    const completed = books.filter(b => b.status === 'completed').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const toRead = books.filter(b => b.status === 'to-read').length;
    
    document.getElementById('booksRead').textContent = completed;
    document.getElementById('currentlyReading').textContent = reading;
    document.getElementById('toRead').textContent = toRead;
}

// Save to localStorage
function saveBooks() {
    localStorage.setItem('books', JSON.stringify(books));
}

// Initialize app
displayBooks();
updateStats();
