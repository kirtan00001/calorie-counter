// pages/CreateUserPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import "./Auth.css";
import { useNavigate } from "react-router-dom";
const url = process.env.REACT_APP_API_URL;

const CreateUserPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${url}/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, email, password }),
      });
      const data = await response.json();
        if (data.status_code !== 200) {
          alert('Error creating user: ' + data.message);
          return;
        }
      localStorage.setItem("jwt", data.data.jwt_token.new_jwt);
      localStorage.setItem("refresh", data.data.refresh_token);
      navigate("/chats");
    } catch (error) {
      alert('Error creating user: ' + error.message);
    }
  }
 return (
  <div className="page">
  <form className="form">
    <h2>Sign Up</h2>
    <input type="text" placeholder="Name" onChange={(e) => {setName(e.target.value)}} required />
    <input type="email" placeholder="Email" onChange={(e) => {setEmail(e.target.value)}} required />
    <input type="password" placeholder="Password" onChange={(e) => {setPassword(e.target.value)}} required />
    <button onClick={handleClick} type="submit">Create Account</button>
  </form>
    <p>Don't have an account? <Link to="/login">Login</Link></p> 
  </div>
);
};

export default CreateUserPage;