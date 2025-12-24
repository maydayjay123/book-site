// Home Page

const currentUser = requireAuth();

async function loadHomeData() {
    try {
        // Get user's books
        const userBooks = await API.getUserBooks(currentUser.id);
        
        // Calculate statistics
        const totalBooks = userBooks.length;
        const ownedBooks = userBooks.filter(b => b.status === 'owned').length;
        const wantToRead = userBooks.filter(b => b.status === 'want').length;
        const currentlyReading = userBooks.filter(b => b.status === 'reading').length;
        const readBooks = userBooks.filter(b => b.status === 'read').length;
        
        // Update stat cards
        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('booksRead').textContent = readBooks;
        document.getElementById('wantToRead').textContent = wantToRead;
        document.getElementById('currentlyReading').textContent = currentlyReading;
        
        // Display currently reading books with progress
        displayCurrentlyReading(userBooks.filter(b => b.status === 'reading'));
        
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
        const progress = book.current_page && book.pages ? 
            Math.round((book.current_page / book.pages) * 100) : 0;
        
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
                    ${book.current_page && book.pages ? `
                        <div style="margin-top: 10px;">
                            <div style="background: var(--bg-secondary); border-radius: 8px; height: 8px; overflow: hidden;">
                                <div style="background: var(--color-success); height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
                            </div>
                            <div style="margin-top: 5px; font-size: 0.9rem; color: var(--text-secondary);">
                                ${progress}% complete (${book.current_page} / ${book.pages} pages)
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
    
    container.innerHTML = books.map(book => `
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
                    ${book.pages ? `<span>${book.pages} pages</span>` : ''}
                </div>
                <div class="card-badges">
                    ${book.status === 'owned' ? '<span class="badge owned">Owned</span>' : ''}
                    ${book.status === 'want' ? '<span class="badge want">Want to Read</span>' : ''}
                    ${book.status === 'reading' ? '<span class="badge reading">Reading</span>' : ''}
                    ${book.status === 'read' ? '<span class="badge read">Read</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Load data on page load
loadHomeData();
