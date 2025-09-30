import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const starContainer = document.querySelector(".stars");
    if (starContainer && starContainer.children.length === 0) {
      for (let i = 0; i < 300; i++) { 
        let star = document.createElement("div");
        star.className = "star";
        star.style.top = Math.random() * 100 + "vh"; 
        star.style.left = Math.random() * 100 + "vw"; 
        star.style.animationDuration = Math.random() * 3 + 1 + "s"; 
        star.style.width = Math.random() * 3 + "px"; 
        star.style.height = star.style.width;
        starContainer.appendChild(star);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
      }
      const response = await fetch("http://localhost:3001/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: data.message, type: "success" });
        if (data.token) {
          localStorage.setItem("token", data.token);
          navigate("/homepage");
        } 
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="background">
      <div className="moon"></div>
      <div className="stars"></div>
      <div className="container">
        <h2>Sign up</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} onClick={() => navigate("/homepage")}>
            {loading ? "Signing up..." : "Sing up"}
          </button>
        </form>
        {/* Mesaj de redirecționare către Login */}
        <p className="redirect">
          Do you have an account? <span onClick={() => navigate("/login")}>Press here</span> to login.
        </p>

        {message && <p className={message.type}>{message.text}</p>}
        {message && <p className={message.type}>{message.text}</p>}
      </div>
    </div>
  );
};

export default Register;
