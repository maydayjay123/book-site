// Authors Page

const currentUser = requireAuth();
let allAuthors = [];
let currentAuthor = null;
let allBooks = [];

async function loadAuthors() {
    try {
        // Get ALL books from database (not just user books)
        const allBooks = await API.getAllBooks();
        
        // Group by author
        const authorMap = {};
        allBooks.forEach(book => {
            if (!authorMap[book.author]) {
                authorMap[book.author] = {
                    name: book.author,
                    books: [],
                    bookCount: 0
                };
            }
            authorMap[book.author].books.push(book);
            authorMap[book.author].bookCount++;
        });
        
        allAuthors = Object.values(authorMap);
        displayAuthors(allAuthors);
    } catch (error) {
        console.error('Error loading authors:', error);
    }
}

function displayAuthors(authors) {
    const grid = document.getElementById('authorsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (authors.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = authors.map(author => `
        <div class="gallery-card" onclick='openAuthorModal(${JSON.stringify(author).replace(/'/g, "&apos;")})'>
            <div class="card-image no-image">
                <span class="no-image-text">${author.name.charAt(0)}</span>
            </div>
            <div class="card-content">
                <div class="card-title">${author.name}</div>
                <div class="card-info">
                    <span>${author.bookCount} book${author.bookCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allAuthors.filter(author => 
        author.name.toLowerCase().includes(searchTerm)
    );
    displayAuthors(filtered);
});

// Modal functions
async function openAuthorModal(author) {
    currentAuthor = author;
    
    document.getElementById('modalTitle').textContent = author.name;
    document.getElementById('modalBookCount').textContent = author.bookCount;
    
    // Display books by this author
    const booksList = document.getElementById('authorBooksList');
    booksList.innerHTML = author.books.map(book => `
        <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;"
             onclick="window.location.href='my-library.html?book=${book.id}'">
            <div style="font-weight: bold; margin-bottom: 5px;">${book.title}</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                ${book.genre || 'Unknown Genre'} • ${book.pages || '?'} pages
            </div>
        </div>
    `).join('');
    
    // Load personal notes by default
    await showNotes('personal');
    
    document.getElementById('authorModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('authorModal').style.display = 'none';
    currentAuthor = null;
}

async function showNotes(type) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const notesContent = document.getElementById('notesContent');
    
    // For authors, we'll use the author name as the item_id (simplified for localStorage)
    const authorId = currentAuthor.name;
    
    if (type === 'personal') {
        const notes = await API.getNotes('author', authorId, currentUser.id);
        const personalNote = notes.find(n => !n.is_public);
        
        if (personalNote) {
            notesContent.innerHTML = `<p>${personalNote.content}</p>`;
        } else {
            notesContent.innerHTML = '<p style="color: var(--text-secondary);">No personal notes yet</p>';
        }
    } else {
        const publicNotes = await API.getPublicNotes('author', authorId);
        
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
    const content = prompt('Write about ' + currentAuthor.name + ':');
    if (content) {
        const isPublic = confirm('Make this note public?');
        API.saveNote(currentUser.id, 'author', currentAuthor.name, content, isPublic);
        showNotes(isPublic ? 'public' : 'personal');
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.id === 'authorModal') {
        closeModal();
    }
});

// Load on page load
loadAuthors();
