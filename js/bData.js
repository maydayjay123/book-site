// bData.js
// Simple Open Library data fetch + structure preview
// Node.js 18+ (has built-in fetch)

const QUERY = "harry potter";
const LIMIT = 5;

async function getBooks() {
  const url =
    `https://openlibrary.org/search.json` +
    `?q=${encodeURIComponent(QUERY)}` +
    `&limit=${LIMIT}` +
    `&fields=key,title,author_name,first_publish_year,isbn,subject,edition_count,number_of_pages_median,cover_i,publisher`;

  const res = await fetch(url);
  const data = await res.json();

  // Map to a clean, predictable structure
  const books = data.docs.map(book => ({
    id: book.key, // Open Library work ID
    title: book.title || null,
    authors: book.author_name || [],
    firstPublishYear: book.first_publish_year || null,
    isbn: book.isbn ? book.isbn.slice(0, 3) : [], // only show a few
    subjects: book.subject ? book.subject.slice(0, 5) : [],
    editionCount: book.edition_count || 0,
    pages: book.number_of_pages_median || null,
    coverId: book.cover_i || null,
    publisher: book.publisher ? book.publisher[0] : null
  }));

  console.log("Book data structure:\n");
  console.dir(books, { depth: null });
  
  console.log("\n\nExample cover URL:");
  if (books[0]?.coverId) {
    console.log(`https://covers.openlibrary.org/b/id/${books[0].coverId}-L.jpg`);
  }
}

getBooks().catch(console.error);
