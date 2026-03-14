import { useNavigate } from 'react-router-dom';
import "./LogoutButton.css"
const LogoutButton = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.clear();
        navigate("/sign-up");
    }
    return (
        <button onClick={handleLogout} className="logout-button">Logout</button>)
}

export default LogoutButton;