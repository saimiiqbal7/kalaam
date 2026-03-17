import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import booksData from '../data/books.json'
import './Library.css'

const books = booksData.books

export default function Library() {
  return (
    <div className="library paper-texture">
      <Nav />
      <header className="library-header">
        <div>
          <Link to="/" className="library-logo">
            <h1 className="library-title">Kalaam</h1>
            <span className="library-title-urdu">کلام</span>
          </Link>
          <p className="library-subtitle">Read English. Learn together.</p>
          <nav className="library-nav">
            <Link to="/library" className="library-nav-link library-nav-link--active">Library</Link>
            <span className="library-nav-sep">·</span>
            <Link to="/words" className="library-nav-link">Word Library</Link>
          </nav>
        </div>
      </header>
      <main className="library-grid">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/read/${book.id}`}
            className="book-card"
            data-difficulty={book.difficulty.toLowerCase()}
          >
            <div className="book-card-cover">
              <img src={book.coverImage} alt={book.title} />
            </div>
            <div className="book-card-info">
              {book.badge && <span className="book-card-original-badge">{book.badge}</span>}
              <h2 className="book-card-title">{book.title}</h2>
              <p className="book-card-author">{book.author}</p>
              {book.description && <p className="book-card-desc">{book.description}</p>}
              <span className="book-card-badge">{book.difficulty}</span>
            </div>
          </Link>
        ))}
      </main>
    </div>
  )
}
