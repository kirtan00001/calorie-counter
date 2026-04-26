import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "./ChatsPage.css";
import LogoutButton from '../LogoutButton.js';

const url = process.env.REACT_APP_API_URL;

const ChatsPage = () => {
    const [chats, setChats] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [pfpUrl, setPfpUrl] = useState(null);
    const [pfpTrigger, setPfpTrigger] = useState(0);
    const navigate = useNavigate();
    const pfpInputRef = useRef(null);

    const defaultPfp = `${url}/uploads/users/default.png`;

    // 1. AUTH GUARD
    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        const refresh = localStorage.getItem("refresh");

        if (!jwt || !refresh) {
            navigate("/login");
        }
    }, [navigate]);

    // 2. Fetch Chats
    useEffect(() => {
        const fetchChats = async () => {
            const jwt = localStorage.getItem("jwt");
            if (!jwt) return;

            try {
                const response = await fetch(`${url}/get-all-chats`);
                const data = await response.json();
                setChats(data.data || []);
            } catch (error) {
                console.error("Chat Fetch Error:", error);
            }
        };
        fetchChats();
    }, [navigate]);

    // 3. Fetch PFP
    useEffect(() => {
        const fetchPFP = async () => {
            const jwt = localStorage.getItem("jwt");
            const refresh = localStorage.getItem("refresh");

            if (!jwt || !refresh) return;

            try {
                const response = await fetch(`${url}/get-my-pfp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const newObjectURL = URL.createObjectURL(blob);
                    setPfpUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev);
                        return newObjectURL;
                    });
                } else {
                    setPfpUrl(null);
                }
            } catch (error) {
                console.error("PFP Fetch Error:", error);
                setPfpUrl(null);
            }
        };
        fetchPFP();
    }, [pfpTrigger, navigate]);

    const handlePfpUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('jwt', localStorage.getItem("jwt"));
        formData.append('refresh', localStorage.getItem("refresh"));

        try {
            const response = await fetch(`${url}/upload-pfp`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setPfpTrigger(prev => prev + 1);
            } else {
                alert(data.message);
            }
        } catch (error) { alert("Upload failed: " + error.message); }
        finally {
            if (pfpInputRef.current) pfpInputRef.current.value = "";
        }
    };

    const handleCreateChat = async (chatName) => {
        setShowModal(false);

        try {
            const response = await fetch(`${url}/create-sub-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: chatName,
                    jwt: localStorage.getItem("jwt"),
                    refresh: localStorage.getItem("refresh")
                }),
            });
            const data = await response.json();
            if (data.success) {
                window.location.href = "/chat?id=" + data.sub_chat_id;
            } else {
                navigate("/login");
            }
        } catch (error) { alert(error.message); }
    };

    return (
        <div className="chats-page-container">
            <div className="pfp-menu-wrapper">
                <div className="pfp-circle-trigger">
                    <img
                        src={pfpUrl || defaultPfp}
                        alt="PFP"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultPfp;
                        }}
                    />
                </div>

                <div className="pfp-dropdown">
                    <div className="pfp-dropdown-item" onClick={() => navigate('/profile')}>
                        My Profile
                    </div>
                    <div className="pfp-dropdown-item" onClick={() => navigate('/search')}>
                        Search
                    </div>
                    <div className="pfp-dropdown-item" onClick={() => pfpInputRef.current.click()}>
                        Upload PFP
                    </div>

                    <div className="pfp-dropdown-item logout-item">
                        <LogoutButton />
                    </div>
                </div>

                <input
                    type="file"
                    ref={pfpInputRef}
                    style={{ display: 'none' }}
                    onChange={handlePfpUpload}
                    accept="image/*"
                />
            </div>

            <div className="parent-card">
                {chats.filter(f => f.chat_id == null).map((chat, index) => (
                    <Card key={chat.sub_chat_id || index} chat={chat} navigate={navigate} />
                ))}
            </div>

            <FloatingButton onClick={() => setShowModal(true)} />

            {showModal && (
                <CreateChatModal
                    onClose={() => setShowModal(false)}
                    onCreate={handleCreateChat}
                />
            )}
        </div>
    );
};

function Card({ chat, navigate }) {
    const goToUser = (e) => {
        e.stopPropagation(); // Prevents the card's onClick from firing
        navigate(`/user?name=${chat.username}`);
    };

    return (
        <div onClick={() => window.location.href = `/chat?id=${chat.sub_chat_id}`} className="chat-card">
            <h3>{chat.sub_chat_name}</h3>
            <p>
                By <span className="user-link" onClick={goToUser}>{chat.username}</span>
            </p>
            <p className="date">{chat.timestamp ? new Date(parseInt(chat.timestamp)).toLocaleDateString() : ""}</p>
        </div>
    );
}

const FloatingButton = ({ onClick }) => <button className="floating-btn" onClick={onClick}>+</button>;

const CreateChatModal = ({ onClose, onCreate }) => {
    const [chatName, setChatName] = useState("");
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <h3>Create New Chat</h3>
                <input type="text" placeholder="Chat name" value={chatName} onChange={(e) => setChatName(e.target.value)} autoFocus />
                <div className="modal-buttons">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={() => onCreate(chatName)} disabled={!chatName.trim()}>Create</button>
                </div>
            </div>
        </div>
    );
};

export default ChatsPage;

