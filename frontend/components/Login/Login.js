import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
      }

      const response = await fetch("http://localhost:3001/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: "Authentication successful!", type: "success" });

        localStorage.setItem("token", data.token);
        
        navigate("/homepage");
        window.location.reload(); 
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");

    try {
      const response = await fetch("http://localhost:3001/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        setForgotMessage({ text: data.message, type: "success" });
        setForgotEmail("");
      } else {
        setForgotMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setForgotMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotMessage("");
  };

  return (
    <div className="background">
      <div className="moon"></div>
      <div className="stars"></div>
      
      <div className="container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
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
          <button type="submit" disabled={loading}>
            {loading ? "Logingin..." : "Login"}
          </button>
        </form>
        
        {message && <p className={message.type}>{message.text}</p>}
        
        <p className="forgot-password">
          <span onClick={() => setShowForgotPassword(true)}>
            Did you forgot your password?
          </span>
        </p>
        
        <p className="redirect">
          Don't have an account?<span onClick={() => navigate("/register")}>Sign up</span>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={closeForgotPasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset password</h3>
              <button className="close-btn" onClick={closeForgotPasswordModal}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword}>
              <p>Enter your email address and we will send you instructions for resetting your password.</p>
              <input
                type="email"
                placeholder="Your email adress"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Sent"}
              </button>
            </form>
            
            {forgotMessage && (
              <p className={`modal-message ${forgotMessage.type}`}>
                {forgotMessage.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;