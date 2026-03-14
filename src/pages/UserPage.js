import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const UserPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/chats');
  }, [navigate]);

  return null; // Nothing to render since we're redirecting
}

export default UserPage;