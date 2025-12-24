// Social-style Book Page
const currentUser = requireAuth();
const params = new URLSearchParams(window.location.search);
const bookId = parseInt(params.get('id'), 10);

let book = null;
let myNotes = [];
let publicNotes = [];

async function loadBook() {
    const allBooks = await API.getAllBooks();
    book = allBooks.find(b => b.id === bookId);
    if (!book) {
        alert('Book not found');
        history.back();
        return;
    }
    renderHero();
    loadNotes();
}

function renderHero() {
    const cover = document.getElementById('heroCover');
    if (book.image_url) {
        cover.innerHTML = `<img src="${book.image_url}" alt="${book.title}">`;
    }
    document.getElementById('heroTitle').textContent = book.title;
    document.getElementById('heroAuthor').textContent = `by ${book.author}`;
    document.getElementById('heroAuthor').onclick = () => {
        window.location.href = `author-detail.html?name=${encodeURIComponent(book.author)}`;
    };
    document.getElementById('infoGenre').textContent = book.genre || 'Unknown';
    document.getElementById('infoPages').textContent = book.pages ? `${book.pages} pages` : 'Unknown';
    const status = (book.statuses && Array.isArray(book.statuses)) ? book.statuses.join(', ') : (book.status || 'Owned');
    document.getElementById('infoStatus').textContent = status;
    document.getElementById('statStatus').textContent = `Status: ${status}`;
    document.getElementById('openNotes').href = `notes-editor.html?book=${book.id}`;
    document.getElementById('openAddNote').href = `notes-editor.html?book=${book.id}`;
}

function loadNotes() {
    myNotes = JSON.parse(localStorage.getItem(`notes_${currentUser.id}`) || '[]').filter(n => n.book_id === bookId);
    publicNotes = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notes_')) {
            try {
                const notes = JSON.parse(localStorage.getItem(key) || '[]');
                publicNotes.push(...notes.filter(n => n.book_id === bookId && n.is_public));
            } catch (e) {
                // ignore bad data
            }
        }
    }
    renderStats();
    renderMyNotes();
    renderPublicNotes();
    renderActivity();
}

function renderStats() {
    document.getElementById('statMyNotes').textContent = myNotes.length;
    document.getElementById('statPublicNotes').textContent = publicNotes.length;
    const people = new Set(publicNotes.map(n => n.user_id));
    document.getElementById('statPeople').textContent = people.size;
}

function renderActivity() {
    const list = document.getElementById('activityList');
    const items = [];
    if (myNotes.length) {
        items.push(`<li>You saved ${myNotes.length} note${myNotes.length === 1 ? '' : 's'}.</li>`);
    }
    if (publicNotes.length) {
        const people = new Set(publicNotes.map(n => n.user_id)).size;
        items.push(`<li>${people} people shared public notes.</li>`);
    }
    list.innerHTML = items.length ? items.join('') : '<li class="muted">No activity yet.</li>';
}

function noteCard(note, mine = false) {
    const creator = getUserDisplay(note.user_id);
    return `
        <div class="note-card">
            <div class="note-thumb"><img src="${note.thumbnail}" alt="Note"></div>
            <div class="note-meta">
                <div class="note-title">${note.book_title}</div>
                <div class="note-sub">by <a href="${creator.href}" class="note-user">${creator.name}</a> • ${new Date(note.created_at).toLocaleDateString()}</div>
                <div class="note-actions">
                    ${mine ? `<a class="btn-secondary btn-compact" href="notes-editor.html?book=${bookId}&note=${note.id}">Edit</a>` : ''}
                    <a class="btn-secondary btn-compact" href="book-detail.html?id=${bookId}">Book Page</a>
                </div>
            </div>
        </div>
    `;
}

function renderMyNotes() {
    const grid = document.getElementById('myNotesGrid');
    const empty = document.getElementById('myNotesEmpty');
    if (!myNotes.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    grid.innerHTML = myNotes.map(n => noteCard(n, true)).join('');
}

function renderPublicNotes() {
    const grid = document.getElementById('publicNotesGrid');
    const empty = document.getElementById('publicNotesEmpty');
    if (!publicNotes.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    grid.innerHTML = publicNotes.map(n => noteCard(n, false)).join('');
}

function getUserDisplay(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.id === userId);
    if (found) return { name: found.username || ('User ' + userId), href: `dashboard.html?user=${userId}` };
    return { name: userId === currentUser.id ? 'You' : 'User ' + userId, href: '#' };
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById(`tab-${btn.dataset.tab}`);
        if (panel) panel.classList.add('active');
    });
});

// Init
loadBook();
