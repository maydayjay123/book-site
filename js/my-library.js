// My Library Page

const currentUser = requireAuth();
let allUserBooks = [];
let currentBook = null;

async function loadLibrary() {
    try {
        const userBooks = await API.getUserBooks(currentUser.id);
        // Show books that have 'owned' in their statuses array
        allUserBooks = userBooks.filter(b => {
            if (b.statuses && Array.isArray(b.statuses)) {
                return b.statuses.includes('owned');
            }
            return b.status === 'owned'; // Backward compatibility
        });
        
        displayBooks(allUserBooks);
    } catch (error) {
        console.error('Error loading library:', error);
    }
}

function displayBooks(books) {
    const grid = document.getElementById('libraryGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (books.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = books.map(book => {
        // Generate star display
        const rating = book.rating || 0;
        const stars = rating > 0 ? '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating)) : '';
        
        // Get all statuses
        const statuses = book.statuses || (book.status ? [book.status] : ['owned']);
        
        // Create badges for all statuses
        const badgeHTML = statuses.map(status => {
            let badgeClass = 'badge';
            let badgeText = '';
            
            if (status === 'owned') {
                badgeClass += ' owned';
                badgeText = 'Owned';
            } else if (status === 'want') {
                badgeClass += ' want';
                badgeText = 'Want to Read';
            } else if (status === 'reading') {
                badgeClass += ' reading';
                badgeText = 'Reading';
            } else if (status === 'read') {
                badgeClass += ' read';
                badgeText = 'Read';
            }
            
            return `<span class="${badgeClass}">${badgeText}</span>`;
        }).join('');
        
        // Get public notes for this book
        const publicNotes = getPublicNotesForBook(book.id);
        const publicNotesHTML = publicNotes.length > 0 ? `
            <div class="card-public-notes">
                <div class="card-public-notes-label">Public Notes (${publicNotes.length})</div>
                <div class="card-notes-thumbnails">
                    ${publicNotes.slice(0, 3).map(note => `
                        <div class="note-thumb" onclick='openNoteViewer(${JSON.stringify(note).replace(/'/g, "&apos;")}, event)'>
                            <img src="${note.thumbnail}" alt="Note">
                        </div>
                    `).join('')}
                    ${publicNotes.length > 3 ? `<div class="note-thumb" style="display: flex; align-items: center; justify-content: center; background: rgba(242,242,242,0.1); font-size: 0.8rem;">+${publicNotes.length - 3}</div>` : ''}
                </div>
            </div>
        ` : '';
        
        return `
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
                ${rating > 0 ? `
                    <div class="card-rating" style="color: #f39c12; font-size: 1.1rem; margin-top: 8px;">
                        ${stars}
                    </div>
                ` : ''}
                <div class="card-badges">
                    ${badgeHTML}
                </div>
                ${publicNotesHTML}
            </div>
        </div>
        `;
    }).join('');
}

// Get public notes for a book
function getPublicNotesForBook(bookId) {
    const allNotes = [];
    
    // Get all users' notes from localStorage (this is a simple implementation)
    // In production, you'd query all users or have a public notes collection
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notes_')) {
            try {
                const userNotes = JSON.parse(localStorage.getItem(key) || '[]');
                const publicNotesForBook = userNotes.filter(n => n.book_id === bookId && n.is_public);
                allNotes.push(...publicNotesForBook);
            } catch (e) {
                // Skip invalid data
            }
        }
    }
    
    return allNotes;
}

// Open note viewer (prevent opening book modal)
function openNoteViewer(note, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const creator = getUserDisplay(note.user_id);
    const bookLink = `book-detail.html?id=${note.book_id}`;
    
    const viewerHTML = `
        <div class="modal" id="noteViewer" style="display: block;">
            <div class="modal-content" style="max-width: 960px;">
                <div class="modal-header">
                    <h2>Note by <a href="${creator.href}" style="color: var(--color-primary); text-decoration: none;">${creator.name}</a></h2>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <a href="${bookLink}" class="btn-secondary btn-compact">Open Book Page</a>
                        <button class="close" onclick="closeNoteViewer()">&times;</button>
                    </div>
                </div>
                <div class="modal-body" style="display: block;">
                    <img src="${note.thumbnail}" alt="Note" style="width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;">
                    <div style="margin-top: 20px;">
                        <p><strong>Book:</strong> ${note.book_title}</p>
                        <p><strong>Author:</strong> ${note.book_author}</p>
                        <p><strong>Created:</strong> ${new Date(note.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing viewer if any
    const existing = document.getElementById('noteViewer');
    if (existing) existing.remove();
    
    // Add new viewer
    document.body.insertAdjacentHTML('beforeend', viewerHTML);
}

function closeNoteViewer() {
    const viewer = document.getElementById('noteViewer');
    if (viewer) viewer.remove();
}

function getUserDisplay(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.id === userId);
    if (found) {
        return { name: found.username || ('User ' + userId), href: `dashboard.html?user=${userId}` };
    }
    return { name: userId === currentUser.id ? 'You' : 'User ' + userId, href: '#' };
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allUserBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.genre && book.genre.toLowerCase().includes(searchTerm))
    );
    displayBooks(filtered);
});

// Modal functions
let selectedStatuses = [];
let selectedRating = 0;

async function openBookModal(book) {
    currentBook = book;
    
    document.getElementById('modalTitle').textContent = book.title;
    document.getElementById('modalAuthor').textContent = book.author;
    document.getElementById('modalGenre').textContent = book.genre || 'Unknown';
    document.getElementById('modalPages').textContent = book.pages || 'Unknown';
    
    // Set image
    const modalImage = document.getElementById('modalImage');
    if (book.image_url) {
        modalImage.innerHTML = `<img src="${book.image_url}" alt="${book.title}">`;
    } else {
        modalImage.innerHTML = '<span class="no-image-text">No Image</span>';
    }
    
    // Set status tags (support multiple statuses)
    if (book.statuses && Array.isArray(book.statuses)) {
        selectedStatuses = [...book.statuses];
    } else if (book.status) {
        selectedStatuses = [book.status];
    } else {
        selectedStatuses = ['owned'];
    }
    updateStatusTags();
    
    // Set rating
    selectedRating = book.rating || 0;
    updateStarRating();
    
    // Set review
    document.getElementById('reviewText').value = book.review || '';
    
    // Setup status tag click handlers (toggle on/off)
    document.querySelectorAll('.status-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const status = this.dataset.status;
            if (selectedStatuses.includes(status)) {
                // Remove status
                selectedStatuses = selectedStatuses.filter(s => s !== status);
            } else {
                // Add status
                selectedStatuses.push(status);
            }
            updateStatusTags();
        });
    });
    
    // Setup star rating click handlers
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarRating();
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            document.querySelectorAll('.star').forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
    
    // Reset stars on mouse leave
    document.getElementById('starRating').addEventListener('mouseleave', function() {
        updateStarRating();
    });
    
    document.getElementById('bookModal').style.display = 'block';
}

function updateStatusTags() {
    document.querySelectorAll('.status-tag').forEach(tag => {
        if (selectedStatuses.includes(tag.dataset.status)) {
            tag.classList.add('active');
        } else {
            tag.classList.remove('active');
        }
    });
}

function updateStarRating() {
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
        star.classList.remove('active');
    });
}

async function saveBookChanges() {
    const review = document.getElementById('reviewText').value;
    
    if (selectedStatuses.length === 0) {
        alert('Please select at least one status!');
        return;
    }
    
    // Update book in localStorage
    const userId = currentUser.id;
    const userBooks = JSON.parse(localStorage.getItem(`userBooks_${userId}`) || '[]');
    const bookIndex = userBooks.findIndex(b => b.id === currentBook.id);
    
    if (bookIndex !== -1) {
        userBooks[bookIndex].statuses = selectedStatuses;
        userBooks[bookIndex].status = selectedStatuses[0]; // Primary status for backward compatibility
        userBooks[bookIndex].rating = selectedRating;
        userBooks[bookIndex].review = review;
        userBooks[bookIndex].updated_at = new Date().toISOString();
        
        localStorage.setItem(`userBooks_${userId}`, JSON.stringify(userBooks));
        
        alert('Changes saved successfully!');
        closeModal();
        loadLibrary();
    }
}

function openNotesPage() {
    window.location.href = `notes-editor.html?book=${currentBook.id}`;
}

function closeModal() {
    document.getElementById('bookModal').style.display = 'none';
    currentBook = null;
    selectedStatuses = [];
    selectedRating = 0;
}


async function deleteBook() {
    if (confirm(`Are you sure you want to delete "${currentBook.title}"?`)) {
        // Delete from allBooks
        await API.deleteBook(currentBook.id);
        
        // Also remove from user's library
        const userId = currentUser.id;
        const userBooks = JSON.parse(localStorage.getItem(`userBooks_${userId}`) || '[]');
        const filteredBooks = userBooks.filter(b => b.id !== currentBook.id);
        localStorage.setItem(`userBooks_${userId}`, JSON.stringify(filteredBooks));
        
        alert('Book deleted successfully!');
        closeModal();
        loadLibrary();
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.id === 'bookModal') {
        closeModal();
    }
});

// Load on page load
loadLibrary();
