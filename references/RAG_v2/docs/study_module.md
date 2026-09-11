# Study Module Documentation (v1)

## Purpose

Provides a personal study library where users can upload PDFs, read them inside the application, and track reading progress.

---

## Backend

### API Router: `/books`

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/books` | Upload a PDF |
| **GET** | `/books` | Fetch user's books |
| **GET** | `/books/{book_id}` | Fetch one book with signed URL |
| **DELETE** | `/books/{book_id}` | Delete a book |
| **PATCH** | `/books/{book_id}/progress` | Update current reading page |
| **PATCH** | `/books/{book_id}/open` | Update last opened timestamp |

### Database

* **Table:** `books`
* **Stored Fields:**
* `title`
* `filename`
* `storage_path`
* `total_pages`
* `current_page`
* `last_opened`
* `uploaded_at`
* `file_size`
* `favorite`
* `archived`
* `user_id`

### Storage

* **Provider:** Supabase Storage
* **Bucket:** `books`
* **File Naming Structure:** `user_id/random_uuid.pdf`

---

## Frontend

### StudyScreen

* **Responsibilities:**
* Upload books
* Display library
* "Continue Reading" section
* Delete books
* Open `BookReader`


* **Data Layer:** Uses `bookApi.js` *(No direct fetch calls)*

### BookReader

* **Responsibilities:**
* Display PDF
* Previous / Next navigation
* Zoom
* Save progress
* Update last opened


* **Dependencies & Data Layer:** Uses `react-pdf` and `bookApi.js` *(No direct fetch calls)*

---

## API Layer (`src/api/bookApi.js`)

*Single source for backend communication.*

* `getBooks()`
* `uploadBook()`
* `getBook()`
* `deleteBook()`
* `updateProgress()`
* `updateLastOpened()`

---

## Feature Roadmap

### Current Features

* [x] Upload PDF
* [x] Read PDF
* [x] Zoom
* [x] Page navigation
* [x] Progress tracking
* [x] "Continue Reading" section
* [x] Delete book
* [x] Secure signed URLs
* [x] Responsive layout (basic)

### Planned Features (Future)

#### Reading

* [ ] Search inside PDF
* [ ] Table of contents
* [ ] Dark mode
* [ ] Fit-to-width
* [ ] Fullscreen

#### AI Features

* [ ] Chat with current book
* [ ] Explain highlighted text
* [ ] Summarize page
* [ ] Generate flashcards
* [ ] Generate MCQs
* [ ] Explain diagrams

#### Study Tools

* [ ] Bookmarks
* [ ] Reading streak
* [ ] Reading time
* [ ] Notes linked to pages
* [ ] Highlight annotations

#### Dashboard Integration (Planned Widgets)

* [ ] Continue Reading
* [ ] Books Uploaded
* [ ] Books Completed
* [ ] Reading Progress
* [ ] Recently Opened
* [ ] Reading Streak

---

## Dependencies

* **Frontend:** `react-pdf`, `pdfjs-dist`, `lucide-react`
* **Backend:** FastAPI, Supabase (Storage, JWT Auth)

---

## Known Improvements Needed

* [ ] Add loading spinner while PDF loads
* [ ] Improve mobile reader experience
* [ ] Implement smoother zoom mechanics
* [ ] Map keyboard shortcuts for navigation
* [ ] Implement lazy loading / virtualized rendering for large PDFs
* [ ] Build robust error handling
* [ ] Add auto-save for reading progress every few pages
* [ ] Introduce optimistic UI updates for smoother interactions