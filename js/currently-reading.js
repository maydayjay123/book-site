// Currently Reading Page

const currentUser = requireAuth();
let allReadingBooks = [];
let currentBook = null;

async function loadReadingBooks() {
    try {
        const userBooks = await API.getUserBooks(currentUser.id);
        // Show books that have 'reading' in their statuses array
        allReadingBooks = userBooks.filter(b => {
            if (b.statuses && Array.isArray(b.statuses)) {
                return b.statuses.includes('reading');
            }
            return b.status === 'reading'; // Backward compatibility
        });
        
        displayBooks(allReadingBooks);
    } catch (error) {
        console.error('Error loading reading books:', error);
    }
}

function displayBooks(books) {
    const grid = document.getElementById('readingGrid');
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
            </div>
        </div>
        `;
    }).join('');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allReadingBooks.filter(book => 
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
        loadReadingBooks();
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
        loadReadingBooks();
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.id === 'bookModal') {
        closeModal();
    }
});

// Load on page load
loadReadingBooks();
