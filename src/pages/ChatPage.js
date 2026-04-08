import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import "./ChatPage.css";

const url = process.env.REACT_APP_API_URL;

// Message component handles its own PFP fetching
const Message = ({ content, username, timestamp, isImg, imgID }) => {
    const [pfpUrl, setPfpUrl] = useState(null);
    const navigate = useNavigate(); // Hook for navigation
    const date = new Date(parseInt(timestamp)).toLocaleTimeString();
    const defaultPfp = `${url}/uploads/users/default.png`;

    useEffect(() => {
        const fetchPFP = async () => {
            try {
                const response = await fetch(`${url}/get-user-pfp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jwt: localStorage.getItem("jwt"),
                        refresh: localStorage.getItem("refresh"),
                        username: username 
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    if (blob.size > 0) {
                        setPfpUrl(URL.createObjectURL(blob));
                    }
                }
            } catch (error) {
                console.error("Error loading message PFP:", error);
            }
        };

        fetchPFP();
        return () => { if (pfpUrl) URL.revokeObjectURL(pfpUrl); };
    }, [username]);

    // Function to handle clicking on the user profile
    const goToUserProfile = () => {
        navigate(`/user?name=${username}`);
    };

    return (
        <div className="message">
            <div className="message-header">
                {/* Wrapped Avatar and Username in a clickable div */}
                <div className="message-user-info" onClick={goToUserProfile} style={{ cursor: 'pointer' }}>
                    <img 
                        src={pfpUrl || defaultPfp} 
                        alt="Avatar" 
                        className="message-avatar"
                        onError={(e) => { e.target.src = defaultPfp; }}
                    />
                    <span className="message-username">{username}</span>
                </div>
                <span className="message-time">{date}</span>
            </div>
            {!isImg ? (
                <div className="message-content">{content}</div>
            ) : (
                <div className="message-content">
                    <img src={`${url}/${imgID}`} alt="Uploaded" className="chat-image-render" />
                </div>
            )}
        </div>
    );
};

const Chat = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const [chatz, setChatz] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const response = await fetch(`${url}/get-sub-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sub_chat_id: id,
                    jwt: localStorage.getItem("jwt"), 
                    refresh: localStorage.getItem("refresh") 
                }),
            });
            const data = await response.json();

            if (data.new_jwt && data.new_jwt !== 'none') {
                localStorage.setItem("jwt", data.new_jwt);
            }

            if (data.success) {
                const messages = data.data.filter(f => f.chat_content != null || f.image_id != null);
                setChatz(messages);
            } else if (data.status_code === 401) {
                localStorage.clear();
                navigate("/sign-up");
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (id == null) {
            navigate("/chats");
        } else {
            fetchData();
        }
    }, [id, navigate, fetchData]);

    useEffect(() => {
        scrollToBottom();
    }, [chatz]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        try {
            const response = await fetch(`${url}/create-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sub_chat_id: id,
                    chat_content: newMessage,
                    jwt: localStorage.getItem("jwt"), 
                    refresh: localStorage.getItem("refresh") 
                }),
            });
            const data = await response.json();

            if (data.message !== "Success!") {
                alert('Error: ' + data.message);
                return;
            }

            if (data.new_jwt && data.new_jwt !== 'none') {
                localStorage.setItem("jwt", data.new_jwt);
            }
            
            setNewMessage("");
            fetchData();
            
        } catch (error) {
            alert('Error sending message: ' + error.message);
        }
    };

    const handleImg = async (e) => {
        if (!e.target || !e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('jwt', localStorage.getItem("jwt"));
        formData.append('refresh', localStorage.getItem("refresh"));
        formData.append('sub_chat_id', id);

        try {
            const response = await fetch(`${url}/upload-chat-image`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.message !== "Success!" && !data.success) {
                alert('Error uploading image: ' + data.message);
                return;
            }

            if (data.new_jwt && data.new_jwt !== 'none') {
                localStorage.setItem("jwt", data.new_jwt);
            }

            fetchData();
        } catch (error) {
            alert('Error uploading image: ' + error.message);
        } finally {
            e.target.value = null;
        }
    };

    return (
        <div className="chat-page">
            <div className="chat-container">
                {chatz.map((chat, index) => (
                    <Message 
                        key={chat.chat_id || index} 
                        content={chat.chat_content}
                        username={chat.username}
                        timestamp={chat.timestamp}
                        isImg={chat.image_id != null}
                        imgID={chat.image_id}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleImg} 
                    accept="image/*"
                />

                <button 
                    type="button" 
                    className="chat-send-btn" 
                    onClick={() => fileInputRef.current.click()}
                >
                    Upload Image
                </button>
                <button type="submit" className="chat-send-btn">Send</button>
            </form>
        </div>
    );
};

export default Chat;