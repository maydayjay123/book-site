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
    `&fields=key,title,author_name,first_publish_year,isbn,subject,edition_count`;

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
    editionCount: book.edition_count || 0
  }));

  console.log("Book data structure:\n");
  console.dir(books, { depth: null });
}

getBooks().catch(console.error);
