// Add Book Page

const currentUser = requireAuth();
let selectedImage = null;
let editingBookId = null;

// Check if editing
const urlParams = new URLSearchParams(window.location.search);
editingBookId = urlParams.get('edit');

if (editingBookId) {
    document.getElementById('pageTitle').textContent = 'Edit Book';
    document.getElementById('submitBtn').textContent = 'Update Book';
    loadBookForEditing(editingBookId);
}

// Open Library Search
async function searchBooks() {
    const query = document.getElementById('bookSearchInput').value.trim();
    
    if (!query) {
        alert('Please enter a search term');
        return;
    }
    
    // Show loading
    document.getElementById('searchLoading').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
    
    try {
        // Request description and more subjects for better genre matching
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,first_publish_year,isbn,subject,edition_count,publisher,number_of_pages_median,cover_i,first_sentence`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Hide loading
        document.getElementById('searchLoading').style.display = 'none';
        
        if (data.docs && data.docs.length > 0) {
            displaySearchResults(data.docs);
        } else {
            document.getElementById('noResults').style.display = 'block';
        }
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('searchLoading').style.display = 'none';
        document.getElementById('noResults').style.display = 'block';
    }
}

function displaySearchResults(books) {
    const resultsList = document.getElementById('searchResultsList');
    document.getElementById('searchResults').style.display = 'block';
    
    resultsList.innerHTML = books.map(book => {
        const title = book.title || 'Unknown Title';
        const authors = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
        const firstAuthor = book.author_name ? book.author_name[0] : 'Unknown Author';
        const year = book.first_publish_year || '';
        const pages = book.number_of_pages_median || '';
        const isbn = book.isbn ? book.isbn[0] : '';
        const subjects = book.subject ? book.subject.slice(0, 5).join(', ') : '';
        const coverId = book.cover_i;
        const description = book.first_sentence ? (Array.isArray(book.first_sentence) ? book.first_sentence[0] : book.first_sentence) : '';
        
        return `
            <div onclick='selectBook(${JSON.stringify({
                title,
                author: firstAuthor,
                year,
                pages,
                isbn,
                subjects,
                coverId,
                description
            }).replace(/'/g, "&apos;")})' 
                style="padding: 15px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.3s;">
                <div style="display: flex; gap: 15px;">
                    ${coverId ? `
                        <img src="https://covers.openlibrary.org/b/id/${coverId}-M.jpg" 
                             style="width: 60px; height: 90px; object-fit: cover; border-radius: 4px;">
                    ` : `
                        <div style="width: 60px; height: 90px; background: var(--bg-primary); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 0.8rem;">No Cover</div>
                    `}
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">${title}</div>
                        <div style="color: var(--text-secondary); margin-bottom: 3px;">by ${authors}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                            ${year ? year : ''} ${pages ? `• ${pages} pages` : ''} ${isbn ? `• ISBN: ${isbn}` : ''}
                        </div>
                        ${subjects ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">${subjects}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add hover effect
    resultsList.querySelectorAll('div[onclick]').forEach(div => {
        div.addEventListener('mouseenter', function() {
            this.style.borderColor = 'var(--color-primary)';
            this.style.background = 'var(--bg-card)';
        });
        div.addEventListener('mouseleave', function() {
            this.style.borderColor = 'transparent';
            this.style.background = 'var(--bg-secondary)';
        });
    });
}

async function selectBook(book) {
    // Debug: Log what data we received
    console.log('Selected book data:', book);
    
    // Populate form with selected book data
    document.getElementById('title').value = book.title || '';
    
    // Fix author - make sure we get the author, not publisher
    const author = book.author || 'Unknown Author';
    document.getElementById('author').value = author;
    console.log('Setting author to:', author);
    
    document.getElementById('publishYear').value = book.year || '';
    document.getElementById('pages').value = book.pages || '';
    document.getElementById('isbn').value = book.isbn || '';
    
    // Fill description if available
    if (book.description) {
        document.getElementById('description').value = book.description;
        console.log('Description set');
    }
    
    // Auto-select genre based on subjects
    let genreMatched = false;
    if (book.subjects) {
        console.log('Subjects:', book.subjects);
        const subjectsLower = book.subjects.toLowerCase();
        const genreSelect = document.getElementById('genre');
        
        // Check for specific genres first
        if (subjectsLower.includes('fantasy') || subjectsLower.includes('magic') || subjectsLower.includes('wizards')) {
            genreSelect.value = 'Fantasy';
            genreMatched = true;
            console.log('Genre set to: Fantasy');
        } else if (subjectsLower.includes('science fiction') || subjectsLower.includes('sci-fi') || subjectsLower.includes('space')) {
            genreSelect.value = 'Science Fiction';
            genreMatched = true;
            console.log('Genre set to: Science Fiction');
        } else if (subjectsLower.includes('mystery') || subjectsLower.includes('detective') || subjectsLower.includes('crime')) {
            genreSelect.value = 'Mystery';
            genreMatched = true;
            console.log('Genre set to: Mystery');
        } else if (subjectsLower.includes('thriller') || subjectsLower.includes('suspense')) {
            genreSelect.value = 'Thriller';
            genreMatched = true;
            console.log('Genre set to: Thriller');
        } else if (subjectsLower.includes('romance') || subjectsLower.includes('love')) {
            genreSelect.value = 'Romance';
            genreMatched = true;
            console.log('Genre set to: Romance');
        } else if (subjectsLower.includes('biography') || subjectsLower.includes('autobiography') || subjectsLower.includes('memoir')) {
            genreSelect.value = 'Biography';
            genreMatched = true;
            console.log('Genre set to: Biography');
        } else if (subjectsLower.includes('history') || subjectsLower.includes('historical')) {
            genreSelect.value = 'History';
            genreMatched = true;
            console.log('Genre set to: History');
        } else if (subjectsLower.includes('horror') || subjectsLower.includes('scary')) {
            genreSelect.value = 'Horror';
            genreMatched = true;
            console.log('Genre set to: Horror');
        } else if (subjectsLower.includes('poetry') || subjectsLower.includes('poem') || subjectsLower.includes('verse')) {
            genreSelect.value = 'Poetry';
            genreMatched = true;
            console.log('Genre set to: Poetry');
        } else if (subjectsLower.includes('drama') || subjectsLower.includes('play') || subjectsLower.includes('theatre')) {
            genreSelect.value = 'Drama';
            genreMatched = true;
            console.log('Genre set to: Drama');
        } else if (subjectsLower.includes('self-help') || subjectsLower.includes('self help') || subjectsLower.includes('self improvement')) {
            genreSelect.value = 'Self-Help';
            genreMatched = true;
            console.log('Genre set to: Self-Help');
        }
        
        // If no specific genre, try broader categories
        if (!genreMatched) {
            if (subjectsLower.includes('fiction') || subjectsLower.includes('novel') || subjectsLower.includes('story')) {
                genreSelect.value = 'Fiction';
                genreMatched = true;
                console.log('Genre set to: Fiction (fallback)');
            } else if (subjectsLower.includes('nonfiction') || subjectsLower.includes('non-fiction') || 
                       subjectsLower.includes('politics') || subjectsLower.includes('philosophy') || 
                       subjectsLower.includes('economics') || subjectsLower.includes('science')) {
                genreSelect.value = 'Non-Fiction';
                genreMatched = true;
                console.log('Genre set to: Non-Fiction (fallback)');
            } else {
                // Last resort - set to Other
                genreSelect.value = 'Other';
                genreMatched = true;
                console.log('Genre set to: Other (no match found)');
            }
        }
    } else {
        // No subjects at all - default to Other
        document.getElementById('genre').value = 'Other';
        console.log('No subjects found - Genre set to: Other');
    }
    
    // Download cover image if available
    if (book.coverId) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`;
        console.log('Downloading cover from:', coverUrl);
        try {
            const response = await fetch(coverUrl);
            const blob = await response.blob();
            const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Book cover">`;
            };
            reader.readAsDataURL(file);
            
            // Store for upload
            selectedImage = file;
            console.log('Cover downloaded successfully');
        } catch (error) {
            console.error('Error downloading cover:', error);
        }
    }
    
    // Scroll to form
    document.getElementById('addBookForm').scrollIntoView({ behavior: 'smooth' });
    
    // Show success message
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `
        <div style="background: var(--color-success); color: white; padding: 15px; border-radius: 8px; text-align: center;">
            Book selected! Review the details below and click "Add Book" to save.
        </div>
    `;
    
    setTimeout(() => {
        document.getElementById('searchResults').style.display = 'none';
    }, 2000);
}

// Allow Enter key to search
document.getElementById('bookSearchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBooks();
    }
});


async function loadBookForEditing(bookId) {
    const allBooks = await API.getAllBooks();
    const book = allBooks.find(b => b.id == bookId);
    
    if (book) {
        document.getElementById('title').value = book.title || '';
        document.getElementById('author').value = book.author || '';
        document.getElementById('genre').value = book.genre || '';
        document.getElementById('pages').value = book.pages || '';
        document.getElementById('description').value = book.description || '';
        document.getElementById('isbn').value = book.isbn || '';
        document.getElementById('publishYear').value = book.publish_year || '';
        
        if (book.image_url) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${book.image_url}" alt="Book cover">`;
            selectedImage = book.image_url;
        }
    }
}

// Image upload handling
document.getElementById('imageInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size
    if (file.size > CONFIG.MAX_IMAGE_SIZE) {
        alert('Image size must be less than 5MB');
        return;
    }
    
    // Check file type
    if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert('Only JPEG, PNG, and WebP images are allowed');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (event) => {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
    
    // Store for upload
    selectedImage = file;
});

// Form submission
document.getElementById('addBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
        const title = document.getElementById('title').value.trim();
        const author = document.getElementById('author').value.trim();
        
        // Check for duplicates (only when adding new, not editing)
        if (!editingBookId) {
            const allBooks = await API.getAllBooks();
            const duplicate = allBooks.find(b => 
                b.title.toLowerCase() === title.toLowerCase() && 
                b.author.toLowerCase() === author.toLowerCase()
            );
            
            if (duplicate) {
                const addToLibrary = confirm(`"${title}" by ${author} already exists in the database. Do you want to add it to your library anyway?`);
                if (addToLibrary) {
                    const status = document.getElementById('status').value;
                    if (status !== 'none') {
                        // Check if already in user library
                        const userBooks = await API.getUserBooks(currentUser.id);
                        const alreadyInLibrary = userBooks.find(b => b.id === duplicate.id);
                        
                        if (alreadyInLibrary) {
                            alert('This book is already in your library!');
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Add Book';
                            return;
                        }
                        
                        await API.addToUserLibrary(currentUser.id, duplicate.id, status);
                        alert('Book added to your library!');
                        window.location.href = 'my-library.html';
                    }
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Book';
                return;
            }
        }
        
        // Upload image if new one selected
        let imageUrl = selectedImage;
        if (selectedImage instanceof File) {
            imageUrl = await API.uploadImage(selectedImage, 'books');
        }
        
        const bookData = {
            title: title,
            author: author,
            genre: document.getElementById('genre').value,
            pages: parseInt(document.getElementById('pages').value) || null,
            description: document.getElementById('description').value.trim(),
            isbn: document.getElementById('isbn').value.trim(),
            publish_year: parseInt(document.getElementById('publishYear').value) || null,
            image_url: imageUrl
        };
        
        let book;
        if (editingBookId) {
            // Update existing book
            book = await API.updateBook(parseInt(editingBookId), bookData);
        } else {
            // Add new book
            book = await API.addBook(bookData);
            
            // Add to user's library if requested
            const status = document.getElementById('status').value;
            if (status !== 'none' && book) {
                await API.addToUserLibrary(currentUser.id, book.id, status);
            }
        }
        
        if (book) {
            alert(editingBookId ? 'Book updated successfully!' : 'Book added successfully!');
            window.location.href = 'my-library.html';
        } else {
            alert('Error saving book. Please try again.');
        }
    } catch (error) {
        console.error('Error saving book:', error);
        alert('Error saving book. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editingBookId ? 'Update Book' : 'Add Book';
    }
});
