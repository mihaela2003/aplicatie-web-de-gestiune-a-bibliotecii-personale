import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Create stars effect
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage({ text: "The passwords don't match!", type: "error" });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ text: "The password must be at least 6 characters long!", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ text: data.message, type: "success" });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        if (response.status === 400 && data.message.includes("Token")) {
          setIsValidToken(false);
        }
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="background">
        <div className="moon"></div>
        <div className="stars"></div>
        <div className="container">
          <h2>Link Invalid</h2>
          <p className="error-message">
            The password reset link is invalid or has expired.
          </p>
          <button onClick={() => navigate("/login")} className="back-btn">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="background">
      <div className="moon"></div>
      <div className="stars"></div>
      <div className="container">
        <h2>Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "It's updating..." : "Update password"}
          </button>
        </form>
        {message && <p className={message.type}>{message.text}</p>}
        <p className="redirect">
          Back to <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;