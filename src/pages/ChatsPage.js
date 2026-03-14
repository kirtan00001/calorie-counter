import { useState, useEffect } from 'react';
import "./ChatsPage.css";
const url = process.env.REACT_APP_API_URL;

const handleChat = (id) => {
  window.location.href = `/chat?id=${id}`;
}

// Floating button
const FloatingButton = ({ onClick }) => {
  return (
    <button className="floating-btn" onClick={onClick}>+</button>
  );
}

// Create Chat Modal Component
const CreateChatModal = ({ onClose, onCreate }) => {
  const [chatName, setChatName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatName.trim()) {
      onCreate(chatName);
    }
  };

  // Close when clicking overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h3>Create New Chat</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter chat name"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            autoFocus
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={!chatName.trim()}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Chat card
function Card ({ chat }) {
  return (
    <div onClick={() => handleChat(chat.sub_chat_id)} className="chat-card">
      <h3>{chat.sub_chat_name}</h3>
      <p>By {chat.username}</p>
      <p className="date">{new Date(parseInt(chat.timestamp)).toLocaleDateString()}</p>
    </div>
  );
}

const ChatsPage = () => {
  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // FIXED: wrapped in useEffect with empty dependency array
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${url}/get-all-chats`);
        const data = await response.json();
        setChats(data.data || []);
      } catch (error) {
        alert('Error fetching chats: ', error);
      }
    };
    fetchChats();
  }, []); // Empty array means this runs once when component mounts

  const createNewChat = () => {
    setShowModal(true);
  }

  const handleCreateChat = async (chatName) => {
    console.log("Creating chat:", chatName);
    setShowModal(false);
    try {
      const response = await fetch(`${url}/create-sub-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: chatName, jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh") }),
      });
      const data = await response.json();
      if (data.message !== "Success!") {
        alert('Error creating chat: ' + data.message);
        return;
      }
      if (data.new_jwt && data.new_jwt !== 'none') {
        localStorage.setItem("jwt", data.new_jwt.new_jwt);
      }
      window.location.href = "/chats?id=" + data.sub_chat_id;
    } catch (error) {
      alert('Error creating chat: ' + error.message);
    }
  }

  return (
    <>
      <div className="parent-card">
        {chats.filter(f => f.chat_id == null).map((chat, index) => (
          <Card key={chat.sub_chat_id || index} chat={chat} />
        ))}
      </div>

      <FloatingButton onClick={createNewChat} />

      {showModal && (
        <CreateChatModal 
          onClose={() => setShowModal(false)} 
          onCreate={handleCreateChat}
        />
      )}
    </>
  );
};

export default ChatsPage;