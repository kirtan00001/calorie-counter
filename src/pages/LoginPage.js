// pages/CreateUserPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import './Auth.css';
const url = process.env.REACT_APP_API_URL;

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${url}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
        if (data.status_code !== 200) {
          alert('Error logging in: ' + data.message);
          return;
        }
      localStorage.setItem("jwt", data.data.jwt_token);
      localStorage.setItem("refresh", data.data.refresh_token);
      navigate("/chats");
    } catch (error) {
      alert('Error logging in: ' + error.message);
    }
  }
 return (
  <div className="page">
  <form className="form">
    <h2>Login</h2>
    <input type="email" placeholder="Email" onChange={(e) => {setEmail(e.target.value)}} required />
    <input type="password" placeholder="Password" onChange={(e) => {setPassword(e.target.value)}} required />
    <button onClick={handleClick} type="submit">Login</button>
  </form>
  <p>Don't have an account? <Link to="/sign-up">Sign up</Link></p>
  </div>
);
};

export default LoginPage;