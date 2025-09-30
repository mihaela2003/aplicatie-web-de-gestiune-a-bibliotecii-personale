import "./OwnedBook.css";
import {jwtDecode} from 'jwt-decode';
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const OwnedBook = () => {
    const { bookId } = useParams(); // Preluăm ID-ul cărții din URL
    const [formData, setFormData] = useState({
        type: "Physical",
        language: "",
        date_owned: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const [bookDetails, setBookDetails] = useState(null);

    // Încărcare detalii carte dacă avem bookId
    useEffect(() => {
        if (bookId) {
            const fetchBookDetails = async () => {
                try {
                    // Verificăm dacă e un ID Google Books (format cu litere)
                    if (isNaN(bookId)) {
                        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
                        setBookDetails(response.data);
                    } else {
                        // Dacă e ID numeric, presupunem că e din baza noastră de date
                        const response = await axios.get(`http://localhost:3001/api/books/${bookId}`);
                        setBookDetails(response.data);
                    }
                } catch (error) {
                    console.error("Eroare la încărcarea detaliilor cărții:", error);
                }
            };
            fetchBookDetails();
        }
    }, [bookId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getCurrentUserId = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        try {
            const decoded = jwtDecode(token);
            return decoded.userId;
        } catch (error) {
            console.error('Eroare decodare token:', error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const userId = getCurrentUserId();
            if (!userId) {
                throw new Error("Nu s-a putut identifica utilizatorul");
            }

            if (!bookId) {
                throw new Error("Lipsește ID-ul cărții");
            }

            // Verificăm dacă cartea există deja în baza noastră de date
            let dbBookId = bookId;
            if (isNaN(bookId)) { // Dacă e ID Google Books
                const checkResponse = await axios.get(
                    `http://localhost:3001/api/books/google/${bookId}`
                ).catch(error => {
                    if (error.response?.status === 404) {
                        return { data: { exists: false } };
                    }
                    throw error;
                });

                if (!checkResponse.data.exists) {
                    // Adăugăm cartea în baza noastră de date
                    if (!bookDetails?.volumeInfo) {
                        throw new Error("Detaliile cărții nu sunt disponibile");
                    }

                    const { title, authors, description, imageLinks, pageCount } = bookDetails.volumeInfo;
                    const newBookData = {
                        google_books_id: bookId,
                        title: title || 'Necunoscut',
                        authors: authors?.join(', ') || 'Autor necunoscut',
                        description: description || '',
                        cover_image: imageLinks?.thumbnail || '',
                        page_count: pageCount || 0
                    };

                    const createResponse = await axios.post(
                        'http://localhost:3001/api/books',
                        newBookData
                    );
                    dbBookId = createResponse.data.id;
                } else {
                    dbBookId = checkResponse.data.book.id;
                }
            }

            // Adăugăm cartea în colecția utilizatorului
            const response = await axios.post("http://localhost:3001/api/ownedbooks", {
                ...formData,
                userId,
                bookId: dbBookId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess("Cartea a fost adăugată în colecția ta!");
            setTimeout(() => {
                navigate(-1); // Înapoi la pagina anterioară
            }, 1500);
            
        } catch (err) {
            setError(err.response?.data?.message || err.message || "A apărut o eroare la adăugarea cărții");
        }
    };

    return (
        <div className="owned-book-container">
            <h2>Add a book to your library</h2>
            
            {bookDetails && (
                <div className="book-preview">
                    <h3>{bookDetails.volumeInfo?.title || bookDetails.title}</h3>
                    <p>by {bookDetails.volumeInfo?.authors?.join(', ') || bookDetails.authors}</p>
                </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="owned-book-form">
                <div className="form-group">
                    <label>Type of book:</label>
                    <select 
                        name="type" 
                        value={formData.type}
                        onChange={handleChange}
                        required
                    >
                        <option value="Physical">Physical</option>
                        <option value="Ebook">E-book</option>
                        <option value="Audiobook">Audiobook</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Language:</label>
                    <input
                        type="text"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        placeholder="ex: Română, Engleză"
                    />
                </div>

                <div className="form-group">
                    <label>Purchase date:</label>
                    <input
                        type="date"
                        name="date_owned"
                        value={formData.date_owned}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn">
                    Add
                </button>
            </form>
        </div>
    );
};

export default OwnedBook;