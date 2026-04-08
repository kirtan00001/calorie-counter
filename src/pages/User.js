import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./User.css"; 

const url = process.env.REACT_APP_API_URL;

const User_Page = () => {
    const [searchParams] = useSearchParams();
    const targetUsername = searchParams.get("name");
    
    const [userChats, setUserChats] = useState([]);
    const [pfpUrl, setPfpUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const defaultPfp = `${url}/uploads/users/default.png`;

    useEffect(() => {
        if (!targetUsername) {
            navigate("/chats");
            return;
        }

        const fetchUserData = async () => {
            const jwt = localStorage.getItem("jwt");
            const refresh = localStorage.getItem("refresh");

            try {
                const infoRes = await fetch(`${url}/get-user-info`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh, username: targetUsername })
                });
                const infoData = await infoRes.json();

                if (infoData.success) {
                    setUserChats(infoData.chats || []);
                    if (infoData.new_jwt && infoData.new_jwt !== 'none') {
                        localStorage.setItem("jwt", infoData.new_jwt);
                    }
                }

                const pfpRes = await fetch(`${url}/get-user-pfp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh, username: targetUsername })
                });

                if (pfpRes.ok) {
                    const blob = await pfpRes.blob();
                    if (blob.size > 0) {
                        setPfpUrl(URL.createObjectURL(blob));
                    }
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();

        return () => { if (pfpUrl) URL.revokeObjectURL(pfpUrl); };
    }, [targetUsername, navigate]);

    if (loading) {
        return <div className="profile-page-container"><h1>Loading Profile...</h1></div>;
    }

    return (
        <div className="profile-page-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>
            
            <div className="profile-content-wrapper">
                <div className="profile-card">
                    <img 
                        src={pfpUrl || defaultPfp} 
                        alt="User Profile" 
                        className="large-profile-pfp"
                        onError={(e) => { e.target.src = defaultPfp; }}
                    />
                    <h1>{targetUsername}</h1>
                    <p className="profile-email">Public Profile</p>
                    
                    <div className="profile-stats">
                        <div className="stat-box">
                            <span>Total Messages</span>
                            <p>{userChats.length}</p>
                        </div>
                        <div className="stat-box">
                            <span>Status</span>
                            <p>Active</p>
                        </div>
                    </div>
                </div>

                <div className="my-chats-section">
                    <h2>Recent Messages from {targetUsername}</h2>
                    <div className="my-chats-list">
                        {userChats.length > 0 ? (
                            userChats.map((msg, index) => (
                                <div 
                                    key={index} 
                                    className="my-chat-item"
                                    onClick={() => navigate(`/chat?id=${msg.sub_chat_id}`)}
                                >
                                    <div className="my-chat-info">
                                        <span className="sub-chat-label">In: {msg.sub_chat_name}</span>
                                        
                                        {/* FIXED LOGIC: If image_id exists, show the image preview */}
                                        {msg.image_id ? (
                                            <div className="chat-preview-image-container">
                                                <img 
                                                    src={`${url}/${msg.image_id}`} 
                                                    alt="Sent content" 
                                                    className="chat-preview-img"
                                                />
                                                {msg.chat_content && <p className="chat-preview-text">"{msg.chat_content}"</p>}
                                            </div>
                                        ) : (
                                            <p className="chat-preview-text">"{msg.chat_content}"</p>
                                        )}

                                        <span className="chat-date">
                                            {new Date(parseInt(msg.timestamp)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="arrow-icon">→</div>
                                </div>
                            ))
                        ) : (
                            <p className="no-chats">This user hasn't posted anything yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default User_Page;