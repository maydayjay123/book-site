// API Layer - Handles both localStorage and Supabase

const API = {
    // ========== BOOKS API ==========
    
    async getAllBooks() {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });
            return error ? [] : data;
        } else {
            return JSON.parse(localStorage.getItem('allBooks') || '[]');
        }
    },
    
    async getUserBooks(userId) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('user_books')
                .select('*, books(*)')
                .eq('user_id', userId);
            return error ? [] : data.map(ub => ({...ub.books, ...ub}));
        } else {
            const userBooks = JSON.parse(localStorage.getItem(`userBooks_${userId}`) || '[]');
            return userBooks;
        }
    },
    
    async addBook(bookData) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('books')
                .insert([bookData])
                .select();
            return error ? null : data[0];
        } else {
            const allBooks = JSON.parse(localStorage.getItem('allBooks') || '[]');
            const newBook = {
                ...bookData,
                id: Date.now(),
                created_at: new Date().toISOString()
            };
            allBooks.push(newBook);
            localStorage.setItem('allBooks', JSON.stringify(allBooks));
            return newBook;
        }
    },
    
    async updateBook(bookId, updates) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('books')
                .update(updates)
                .eq('id', bookId)
                .select();
            return error ? null : data[0];
        } else {
            const allBooks = JSON.parse(localStorage.getItem('allBooks') || '[]');
            const index = allBooks.findIndex(b => b.id === bookId);
            if (index !== -1) {
                allBooks[index] = {...allBooks[index], ...updates};
                localStorage.setItem('allBooks', JSON.stringify(allBooks));
                return allBooks[index];
            }
            return null;
        }
    },
    
    async deleteBook(bookId) {
        if (useSupabase) {
            const { error } = await supabaseClient
                .from('books')
                .delete()
                .eq('id', bookId);
            return !error;
        } else {
            let allBooks = JSON.parse(localStorage.getItem('allBooks') || '[]');
            allBooks = allBooks.filter(b => b.id !== bookId);
            localStorage.setItem('allBooks', JSON.stringify(allBooks));
            return true;
        }
    },
    
    async addToUserLibrary(userId, bookId, status = 'owned') {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('user_books')
                .insert([{ user_id: userId, book_id: bookId, status }])
                .select();
            return error ? null : data[0];
        } else {
            const userBooks = JSON.parse(localStorage.getItem(`userBooks_${userId}`) || '[]');
            const allBooks = JSON.parse(localStorage.getItem('allBooks') || '[]');
            const book = allBooks.find(b => b.id === bookId);
            if (book) {
                // Check if book already exists in user library
                const existingIndex = userBooks.findIndex(b => b.id === bookId);
                
                if (existingIndex !== -1) {
                    // Book exists, update statuses
                    const existingStatuses = userBooks[existingIndex].statuses || [userBooks[existingIndex].status];
                    if (!existingStatuses.includes(status)) {
                        existingStatuses.push(status);
                    }
                    userBooks[existingIndex].statuses = existingStatuses;
                    userBooks[existingIndex].status = existingStatuses[0];
                    userBooks[existingIndex].updated_at = new Date().toISOString();
                } else {
                    // New book, create with statuses array
                    const userBook = {
                        ...book,
                        user_book_id: Date.now(),
                        status,
                        statuses: [status],
                        added_at: new Date().toISOString()
                    };
                    userBooks.push(userBook);
                }
                
                localStorage.setItem(`userBooks_${userId}`, JSON.stringify(userBooks));
                return userBooks[existingIndex !== -1 ? existingIndex : userBooks.length - 1];
            }
            return null;
        }
    },
    
    // ========== AUTHORS API ==========
    
    async getAllAuthors() {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('authors')
                .select('*')
                .order('name');
            return error ? [] : data;
        } else {
            return JSON.parse(localStorage.getItem('authors') || '[]');
        }
    },
    
    async addAuthor(authorData) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('authors')
                .insert([authorData])
                .select();
            return error ? null : data[0];
        } else {
            const authors = JSON.parse(localStorage.getItem('authors') || '[]');
            const newAuthor = {
                ...authorData,
                id: Date.now(),
                created_at: new Date().toISOString()
            };
            authors.push(newAuthor);
            localStorage.setItem('authors', JSON.stringify(authors));
            return newAuthor;
        }
    },
    
    async updateAuthor(authorId, updates) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('authors')
                .update(updates)
                .eq('id', authorId)
                .select();
            return error ? null : data[0];
        } else {
            const authors = JSON.parse(localStorage.getItem('authors') || '[]');
            const index = authors.findIndex(a => a.id === authorId);
            if (index !== -1) {
                authors[index] = {...authors[index], ...updates};
                localStorage.setItem('authors', JSON.stringify(authors));
                return authors[index];
            }
            return null;
        }
    },
    
    // ========== NOTES API ==========
    
    async getNotes(itemType, itemId, userId) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('notes')
                .select('*')
                .eq('item_type', itemType)
                .eq('item_id', itemId)
                .eq('user_id', userId);
            return error ? [] : data;
        } else {
            const notes = JSON.parse(localStorage.getItem(`notes_${userId}`) || '[]');
            return notes.filter(n => n.item_type === itemType && n.item_id === itemId);
        }
    },
    
    async saveNote(userId, itemType, itemId, content, isPublic = false) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('notes')
                .insert([{
                    user_id: userId,
                    item_type: itemType,
                    item_id: itemId,
                    content,
                    is_public: isPublic
                }])
                .select();
            return error ? null : data[0];
        } else {
            const notes = JSON.parse(localStorage.getItem(`notes_${userId}`) || '[]');
            const newNote = {
                id: Date.now(),
                user_id: userId,
                item_type: itemType,
                item_id: itemId,
                content,
                is_public: isPublic,
                created_at: new Date().toISOString()
            };
            notes.push(newNote);
            localStorage.setItem(`notes_${userId}`, JSON.stringify(notes));
            return newNote;
        }
    },
    
    async getPublicNotes(itemType, itemId) {
        if (useSupabase) {
            const { data, error } = await supabaseClient
                .from('notes')
                .select('*, users(username)')
                .eq('item_type', itemType)
                .eq('item_id', itemId)
                .eq('is_public', true);
            return error ? [] : data;
        } else {
            // Get all users' notes and filter public ones
            const allNotes = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('notes_')) {
                    const notes = JSON.parse(localStorage.getItem(key) || '[]');
                    allNotes.push(...notes);
                }
            }
            return allNotes.filter(n => 
                n.item_type === itemType && 
                n.item_id === itemId && 
                n.is_public === true
            );
        }
    },
    
    // ========== IMAGE UPLOAD ==========
    
    async uploadImage(file, folder = 'books') {
        if (!file) return null;
        
        // Check file size
        if (file.size > CONFIG.MAX_IMAGE_SIZE) {
            alert('Image size must be less than 5MB');
            return null;
        }
        
        // Check file type
        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert('Only JPEG, PNG, and WebP images are allowed');
            return null;
        }
        
        if (useSupabase) {
            const fileName = `${folder}/${Date.now()}_${file.name}`;
            const { data, error } = await supabaseClient.storage
                .from('images')
                .upload(fileName, file);
                
            if (error) {
                console.error('Upload error:', error);
                return null;
            }
            
            const { data: urlData } = supabaseClient.storage
                .from('images')
                .getPublicUrl(fileName);
                
            return urlData.publicUrl;
        } else {
            // Convert to base64 for localStorage
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        }
    },
    
    // ========== STATISTICS ==========
    
    async getUserStats(userId) {
        const userBooks = await this.getUserBooks(userId);
        const owned = userBooks.filter(b => b.status === 'owned').length;
        const wantToRead = userBooks.filter(b => b.status === 'want').length;
        const authors = new Set(userBooks.map(b => b.author)).size;
        
        return {
            totalBooks: userBooks.length,
            owned,
            wantToRead,
            authors
        };
    }
};

// Export API
window.API = API;
