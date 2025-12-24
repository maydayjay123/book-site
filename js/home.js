// Home Page

const currentUser = requireAuth();

async function loadHomeData() {
    try {
        // Get user's books
        const userBooks = await API.getUserBooks(currentUser.id);
        const hasStatus = (book, status) => {
            if (book.statuses && Array.isArray(book.statuses)) {
                return book.statuses.includes(status);
            }
            return book.status === status;
        };
        
        // Calculate statistics
        const totalBooks = userBooks.length;
        const ownedBooks = userBooks.filter((b) => hasStatus(b, 'owned')).length;
        const wantToRead = userBooks.filter((b) => hasStatus(b, 'want')).length;
        const currentlyReading = userBooks.filter((b) => hasStatus(b, 'reading')).length;
        const readBooks = userBooks.filter((b) => hasStatus(b, 'read')).length;
        
        // Update stat cards
        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('booksRead').textContent = readBooks;
        document.getElementById('wantToRead').textContent = wantToRead;
        document.getElementById('currentlyReading').textContent = currentlyReading;
        
        // Display currently reading books with progress
        displayCurrentlyReading(userBooks.filter((b) => hasStatus(b, 'reading')));
        
        // Display recent activity (last 8 books added)
        displayRecentActivity(userBooks.slice(0, 8));
        
    } catch (error) {
        console.error('Error loading home data:', error);
    }
}

function displayCurrentlyReading(books) {
    const container = document.getElementById('currentlyReadingList');
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>You're not currently reading any books</p>
                <button class="btn-primary" onclick="window.location.href='add-book.html'" style="margin-top: 15px;">Add a Book</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => {
        const currentPage = book.currentPage || book.current_page || 0;
        const totalPages = book.pages || book.totalPages || 0;
        const progress = totalPages > 0 
            ? Math.round((currentPage / totalPages) * 100) 
            : 0;
        
        return `
            <div class="gallery-card">
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
                    </div>
                    ${totalPages > 0 ? `
                        <div style="margin-top: 10px;">
                            <div style="background: var(--bg-secondary); border-radius: 8px; height: 8px; overflow: hidden;">
                                <div style="background: var(--color-success); height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
                            </div>
                            <div style="margin-top: 5px; font-size: 0.9rem; color: var(--text-secondary);">
                                ${progress}% complete (${currentPage} / ${totalPages} pages)
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function displayRecentActivity(books) {
    const container = document.getElementById('recentActivity');
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>No books in your library yet</p>
                <button class="btn-primary" onclick="window.location.href='add-book.html'" style="margin-top: 15px;">Add Your First Book</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => {
        const statuses = book.statuses && Array.isArray(book.statuses)
            ? book.statuses
            : (book.status ? [book.status] : []);

        const badgeHTML = statuses.map((status) => {
            if (status === 'owned') {
                return '<span class="badge owned">Owned</span>';
            }
            if (status === 'want') {
                return '<span class="badge want">Want to Read</span>';
            }
            if (status === 'reading') {
                return '<span class="badge reading">Reading</span>';
            }
            if (status === 'read') {
                return '<span class="badge read">Read</span>';
            }
            return '';
        }).join('');

        const totalPages = book.pages || book.totalPages;

        return `
        <div class="gallery-card">
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
                    ${totalPages ? `<span>${totalPages} pages</span>` : ''}
                </div>
                <div class="card-badges">
                    ${badgeHTML}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Load data on page load
loadHomeData();
