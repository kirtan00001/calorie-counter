import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import "./ChatPage.css"
const url = process.env.REACT_APP_API_URL;

// Message component
const Message = ({ content, username, timestamp }) => {
  const date = new Date(parseInt(timestamp)).toLocaleTimeString();
  
  return (
    <div className="message">
      <div className="message-header">
        <span className="message-username">{username}</span>
        <span className="message-time">{date}</span>
      </div>
      <div className="message-content">{content}</div>
    </div>
  );
}

const Chat = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const [chatz, setChatz] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch( `${url}/get-sub-chat`, {
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
                    localStorage.setItem("jwt", data.new_jwt.new_jwt);
                }
                const messages = data.data.filter(f => f.chat_content != null);
                setChatz(messages);
            } catch (error) {
                localStorage.clear();
                navigate("/sign-up")
            }
        };
        
        if (id) {
            fetchData();
        }
    }, [id]);
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
                alert('Error sending message: ' + data.message);
                return;
            }
            if (data.new_jwt && data.new_jwt !== 'none') {
                localStorage.setItem("jwt", data.new_jwt);
            }
            
            // Add message to UI immediately (optional - or refetch)
            setNewMessage("");
            
            // Refetch messages to get the new one
            const fetchData = async () => {
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
                const messages = data.data.filter(f => f.chat_content != null);
                setChatz(messages);
            };
            fetchData();
            
        } catch (error) {
            alert('Error sending message: ' + error.message);
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
                <button type="submit" className="chat-send-btn">Send</button>
            </form>
        </div>
    );
}

export default Chat;