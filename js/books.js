// Books Page (All Books in Database)

const currentUser = requireAuth();
let allDatabaseBooks = [];
let currentBook = null;
let userBookStatusById = new Map();

async function loadAllBooks() {
    try {
        const [books, userBooks] = await Promise.all([
            API.getAllBooks(),
            API.getUserBooks(currentUser.id)
        ]);

        // Build a quick lookup of the current user's relationship to each book
        userBookStatusById = new Map((userBooks || []).map(b => [b.id, b.status]));

        allDatabaseBooks = books;
        
        displayBooks(allDatabaseBooks);
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

function displayBooks(books) {
    const grid = document.getElementById('booksGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (books.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = books.map(book => `
        <div class="gallery-card" onclick='openBookModal(${JSON.stringify(book).replace(/'/g, "&apos;")})'>
            <div class="card-image ${book.image_url ? '' : 'no-image'}">
                ${book.image_url ? 
                    `<img src="${book.image_url}" alt="${book.title}">` :
                    `<span class="no-image-text">No Image</span>`
                }
            </div>
            <div class="card-content">
                <div class="card-title">${book.title}</div>
                <div class="card-subtitle">by ${book.author}</div>
                <div class="card-info">
                    <span>${book.genre || 'Unknown Genre'}</span>
                    ${book.pages ? `<span>${book.pages} pages</span>` : ''}
                </div>
                ${renderStatusBadges(book.id)}
            </div>
        </div>
    `).join('');
}

function renderStatusBadges(bookId) {
    const status = userBookStatusById.get(bookId);
    if (!status) return '';
    if (status === 'owned') {
        return `<div class="card-badges"><span class="badge owned">Owned</span></div>`;
    }
    if (status === 'want') {
        return `<div class="card-badges"><span class="badge want">Want to Read</span></div>`;
    }
    return '';
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allDatabaseBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.genre && book.genre.toLowerCase().includes(searchTerm))
    );
    displayBooks(filtered);
});

// Modal functions
async function openBookModal(book) {
    currentBook = book;
    
    document.getElementById('modalTitle').textContent = book.title;
    document.getElementById('modalAuthor').textContent = book.author;
    document.getElementById('modalGenre').textContent = book.genre || 'Unknown';
    document.getElementById('modalPages').textContent = book.pages || 'Unknown';
    
    // Description
    if (book.description) {
        document.getElementById('descItem').style.display = 'block';
        document.getElementById('modalDesc').textContent = book.description;
    } else {
        document.getElementById('descItem').style.display = 'none';
    }
    
    // Set image
    const modalImage = document.getElementById('modalImage');
    if (book.image_url) {
        modalImage.innerHTML = `<img src="${book.image_url}" alt="${book.title}">`;
    } else {
        modalImage.innerHTML = '<span class="no-image-text">No Image</span>';
    }
    
    // Load personal notes by default
    await showNotes('personal');

    // Show the user's current status for this book (if any)
    const status = userBookStatusById.get(book.id);
    const statusEl = document.getElementById('modalUserStatus');
    if (statusEl) {
        if (status === 'owned') {
            statusEl.innerHTML = '<span class="badge owned">Owned</span>';
        } else if (status === 'want') {
            statusEl.innerHTML = '<span class="badge want">Want to Read</span>';
        } else {
            statusEl.textContent = 'Not added yet';
        }
    }

    // Update button text so it doesn't look like you can "mint" duplicates
    const addBtn = document.getElementById('addToLibraryBtn');
    if (addBtn) {
        if (!status) addBtn.textContent = 'Add to My Library';
        else if (status === 'owned') addBtn.textContent = 'Change to Want to Read';
        else if (status === 'want') addBtn.textContent = 'Change to Owned';
        else addBtn.textContent = 'Update Status';
    }
    
    document.getElementById('bookModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('bookModal').style.display = 'none';
    currentBook = null;
}

async function showNotes(type) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const notesContent = document.getElementById('notesContent');
    
    if (type === 'personal') {
        const notes = await API.getNotes('book', currentBook.id, currentUser.id);
        const personalNote = notes.find(n => !n.is_public);
        
        if (personalNote) {
            notesContent.innerHTML = `<p>${personalNote.content}</p>`;
        } else {
            notesContent.innerHTML = '<p style="color: var(--text-secondary);">No personal notes yet</p>';
        }
    } else {
        const publicNotes = await API.getPublicNotes('book', currentBook.id);
        
        if (publicNotes.length > 0) {
            notesContent.innerHTML = publicNotes.map(note => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
                    <p>${note.content}</p>
                    <small style="color: var(--text-secondary);">- ${note.users?.username || 'Anonymous'}</small>
                </div>
            `).join('');
        } else {
            notesContent.innerHTML = '<p style="color: var(--text-secondary);">No public notes yet</p>';
        }
    }
}

function editNotes() {
    const content = prompt('Enter your note:');
    if (content) {
        const isPublic = confirm('Make this note public?');
        API.saveNote(currentUser.id, 'book', currentBook.id, content, isPublic);
        showNotes(isPublic ? 'public' : 'personal');
    }
}

async function addToLibrary() {
    if (!currentBook) return;

    const existing = userBookStatusById.get(currentBook.id);
    let status;

    if (!existing) {
        const choice = confirm('Add to "My Library" (OK) or "Want to Read" (Cancel)?');
        status = choice ? 'owned' : 'want';
    } else if (existing === 'owned') {
        const move = confirm('This book is already Owned. Move it to "Want to Read"?');
        if (!move) return;
        status = 'want';
    } else if (existing === 'want') {
        const move = confirm('This book is already in "Want to Read". Mark it as Owned?');
        if (!move) return;
        status = 'owned';
    } else {
        // Unknown / legacy status
        const choice = confirm('Set status to Owned (OK) or Want to Read (Cancel)?');
        status = choice ? 'owned' : 'want';
    }

    const result = await API.addToUserLibrary(currentUser.id, currentBook.id, status);
    if (!result) {
        alert('Could not update your library. Please try again.');
        return;
    }

    // Refresh local status map + UI so badges update immediately
    userBookStatusById.set(currentBook.id, status);
    displayBooks(allDatabaseBooks);
    openBookModal(currentBook);
}

function editBook() {
    window.location.href = `add-book.html?edit=${currentBook.id}`;
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.id === 'bookModal') {
        closeModal();
    }
});

// Load on page load
loadAllBooks();
