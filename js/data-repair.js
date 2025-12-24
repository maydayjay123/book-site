// Data Repair Utility
// Run this in browser console if you have data issues

const DataRepair = {
    // Rebuild allBooks from userBooks
    rebuildAllBooks() {
        console.log('Starting allBooks rebuild...');
        
        const allBooksMap = new Map();
        
        // Scan all userBooks_ entries
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key.startsWith('userBooks_')) {
                const userBooks = JSON.parse(localStorage.getItem(key) || '[]');
                console.log(`Found ${userBooks.length} books in ${key}`);
                
                userBooks.forEach(book => {
                    if (!allBooksMap.has(book.id)) {
                        // Extract just the book data (remove user-specific fields)
                        const cleanBook = {
                            id: book.id,
                            title: book.title,
                            author: book.author,
                            genre: book.genre,
                            pages: book.pages,
                            description: book.description,
                            isbn: book.isbn,
                            publish_year: book.publish_year,
                            image_url: book.image_url,
                            created_at: book.created_at || new Date().toISOString()
                        };
                        allBooksMap.set(book.id, cleanBook);
                    }
                });
            }
        }
        
        const allBooks = Array.from(allBooksMap.values());
        localStorage.setItem('allBooks', JSON.stringify(allBooks));
        
        console.log(`✅ Rebuilt allBooks with ${allBooks.length} books`);
        return allBooks;
    },
    
    // Remove duplicate books from user library
    removeDuplicates(userId) {
        console.log('Removing duplicates for user:', userId);
        
        const userBooks = JSON.parse(localStorage.getItem(`userBooks_${userId}`) || '[]');
        // Dedupe by book id (preferred) with a fallback to title/author.
        // If multiple duplicates exist, keep the most recently added/updated.
        const byKey = new Map();
        for (const book of userBooks) {
            const key = String(book.id || `${book.title}-${book.author}`.toLowerCase());
            const prev = byKey.get(key);
            if (!prev) {
                byKey.set(key, book);
                continue;
            }
            const prevTime = Date.parse(prev.updated_at || prev.added_at || prev.created_at || 0);
            const bookTime = Date.parse(book.updated_at || book.added_at || book.created_at || 0);
            if (bookTime >= prevTime) {
                console.log(`Removing duplicate (keeping newest): ${prev.title} by ${prev.author}`);
                byKey.set(key, book);
            } else {
                console.log(`Removing duplicate: ${book.title} by ${book.author}`);
            }
        }
        const unique = Array.from(byKey.values());
        
        localStorage.setItem(`userBooks_${userId}`, JSON.stringify(unique));
        console.log(`✅ Removed ${userBooks.length - unique.length} duplicates`);
        console.log(`   Kept ${unique.length} unique books`);
        
        return unique;
    },
    
    // Show current data status
    status() {
        const allBooks = JSON.parse(localStorage.getItem('allBooks') || '[]');
        console.log(`📚 Global Books Database: ${allBooks.length} books`);
        
        let totalUserBooks = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('userBooks_')) {
                const userBooks = JSON.parse(localStorage.getItem(key) || '[]');
                const userId = key.replace('userBooks_', '');
                console.log(`👤 User ${userId}: ${userBooks.length} books`);
                totalUserBooks += userBooks.length;
            }
        }
        
        console.log(`📊 Total: ${allBooks.length} global, ${totalUserBooks} in user libraries`);
    },
    
    // Full repair: rebuild and dedupe
    fullRepair() {
        console.log('🔧 Starting full data repair...\n');
        
        // Get current user
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) {
            console.error('❌ Not logged in');
            return;
        }
        
        // Step 1: Rebuild allBooks
        console.log('Step 1: Rebuilding allBooks...');
        this.rebuildAllBooks();
        
        // Step 2: Remove duplicates for current user
        console.log('\nStep 2: Removing duplicates...');
        this.removeDuplicates(currentUser.id);
        
        // Step 3: Show status
        console.log('\n📊 Final Status:');
        this.status();
        
        console.log('\n✅ Repair complete! Refresh the page.');
    }
};

// Make it globally available
window.DataRepair = DataRepair;

console.log('Data Repair Utility Loaded!');
console.log('Available commands:');
console.log('  DataRepair.status() - Show current data');
console.log('  DataRepair.rebuildAllBooks() - Rebuild global database');
console.log('  DataRepair.removeDuplicates(userId) - Remove duplicate books');
console.log('  DataRepair.fullRepair() - Run all repairs');
