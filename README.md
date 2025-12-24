# 📚 Readers Paradise

Your personal multi-user reading tracker with dark mode and comprehensive statistics!

## Features

✅ **Multi-User System**
- Admin panel to create new users
- Each user has their own private data
- Secure login system

✅ **Book Tracking**
- Add books with title, author, genre, page count
- Track reading status (Want to Read, Currently Reading, Read)
- Rate and review books
- Track reading progress with page numbers

✅ **Statistics & Analytics**
- Bar chart showing pages read per month (2026)
- Pie chart showing genre distribution
- Reading challenge tracker with progress circle
- Total books, pages, and average rating

✅ **Advanced Features**
- Clickable books leading to detailed view pages
- Clickable authors leading to author pages with notes
- Author pages show all books by that author
- Dark mode toggle
- Responsive design

## Getting Started

### Default Login
- **Username:** admin
- **Password:** admin123

### First Time Setup

1. Open `index.html` in your web browser
2. Login with the default admin credentials
3. Go to Admin Panel
4. Create new users with temporary passwords
5. New users can login and start tracking their books!

## File Structure

```
readers-paradise/
├── index.html              # Login page
├── admin.html             # Admin panel for user management
├── dashboard.html         # Main dashboard
├── book-detail.html       # Book detail page
├── author-detail.html     # Author detail page
├── css/
│   └── styles.css         # All styles with dark mode
└── js/
    ├── auth.js            # Authentication system
    ├── admin.js           # Admin panel logic
    ├── dashboard.js       # Dashboard functionality
    ├── book-detail.js     # Book detail page logic
    └── author-detail.js   # Author detail page logic
```

## How to Use

### Admin Panel
1. Login as admin
2. Click "Admin Panel" button
3. Create new users with username, display name, and temporary password
4. Users will be prompted to change their password on first login

### Adding Books
1. Click "+ Add Book" button
2. Fill in all required fields (Title, Author, Genre, Pages, Status)
3. Optionally add rating, review, current page, and finish date
4. Click "Save Book"

### Tracking Reading Progress
- Set status to "Currently Reading"
- Update "Current Page" to track progress
- Progress bars and percentages update automatically

### Setting Reading Challenge
1. Click "Edit Goal" in the Reading Challenge card
2. Set your goal for 2026
3. Progress updates automatically as you mark books as "Read"

### Viewing Book Details
- Click on any book card to see full details
- Edit or delete from the detail page
- Click author name to see all books by that author

### Author Pages
- View all books by a specific author
- Add notes about the author
- Navigate between books easily

### Dark Mode
- Click the moon/sun icon in the top navigation
- Theme preference is saved automatically

## Data Storage

All data is stored in your browser's localStorage:
- Each user has separate data storage
- Data persists between sessions
- No internet connection required

## Browser Compatibility

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Tips

1. **Reading Challenge:** Set realistic goals and update them anytime
2. **Reviews:** Write reviews while the book is fresh in your mind
3. **Author Notes:** Keep track of favorite authors and their writing style
4. **Dark Mode:** Perfect for late-night reading sessions
5. **Progress Tracking:** Update your current page regularly to see accurate statistics

## Need Help?

- Make sure JavaScript is enabled in your browser
- Clear cache if you encounter issues
- Data is stored locally - don't clear browser data unless you want to reset everything

## Security Note

This is a client-side application for personal use. Passwords are encoded with Base64 (basic encoding). For production use, implement proper encryption and server-side authentication.

---

Enjoy tracking your reading journey! 📖✨
