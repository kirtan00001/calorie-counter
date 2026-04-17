import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./ProfilePage.css";

const url = process.env.REACT_APP_API_URL;

const ProfilePage = () => {
    const [pfpUrl, setPfpUrl] = useState(null);
    const [myChats, setMyChats] = useState([]);
    const [userData, setUserData] = useState("User");
    const navigate = useNavigate();
    const defaultPfp = `${url}/uploads/users/default.png`;
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        const refresh = localStorage.getItem("refresh");
        if (!jwt || !refresh) {
            navigate("/login");
            return;
        }
                const checkFollowing = async (username) => {
            const infoRes = await fetch(`${url}/get-followers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), username })
            });
            const infoData = await infoRes.json();
            setFollowersCount(infoData.data.length);
            
            const infoRes1 = await fetch(`${url}/get-following`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), username})
            });
            const infoData1 = await infoRes1.json();
            setFollowingCount(infoData1.data.length);
        };


        // Helper to update JWT if backend refreshes it
        const updateToken = (newJwt_) => {
            const newJwt = newJwt_.new_jwt;
            if (newJwt && newJwt !== 'none') {
                localStorage.setItem("jwt", newJwt);
            }
        };

        // 1. Fetch Profile Picture
        const fetchPFP = async () => {
            try {
                const response = await fetch(`${url}/get-my-pfp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    setPfpUrl(URL.createObjectURL(blob));
                }
            } catch (error) { console.error("Error fetching PFP:", error); }
        };

        // 2. Fetch User Info (Now using your new backend route)
        const fetchUserInfo = async () => {
            try {
                const response = await fetch(`${url}/get-my-info`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh })
                });
                const data = await response.json();
                    setUserData(data.user);
                    updateToken(data.new_jwt);
                    return data.user;
    
            } catch (e) { 
                alert("Error fetching user info: ", e);
                setUserData({ username: "Error Loading", email: "" });
            }
        };

        // 3. Fetch "My Chats"
        const fetchMyChats = async () => {
            try {
                const response = await fetch(`${url}/get-my-chats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh })
                });
                const data = await response.json();
                if (data.success) {
                    setMyChats(data.data || []);
                    updateToken(data.new_jwt);
                }
            } catch (error) { console.error("Error fetching my chats:", error); }
        };
        const run = async () => {
        await fetchPFP();
        const name = await fetchUserInfo();
        await fetchMyChats();
        await checkFollowing(name);
        }
        run()
    }, [navigate]);

    return (
        <div className="profile-page-container">
            <button className="back-btn" onClick={() => navigate("/chats")}>
                ← Back to Chats
            </button>
            
            <div className="profile-content-wrapper">
                {/* Profile Section */}
                <div className="profile-card">
                    <img 
                        src={pfpUrl || defaultPfp} 
                        alt="Profile" 
                        className="large-profile-pfp"
                        onError={(e) => { e.target.src = defaultPfp; }}
                    />
                                        <h1>{userData}</h1>                    

                    <div className="profile-stats-next">
                        <div onClick={() => navigate(`/followers?id=${userData}`)} className="stat-box-next">
                        <span>Followers</span>
                        <p>{followersCount}</p>
                        </div>
                    </div>
                    <div className="profile-stats-next">
                        <div onClick={() => navigate(`/following?id=${userData}`)} className="stat-box-next">
                            <span>Following</span>
                            <p>{followingCount}</p>
                        </div>
                    </div>
                    {/* If data is still loading, display username from userData state */}
                    <div className="profile-stats">
                        <div className="stat-box">
                            <span>Posts</span>
                            <p>{myChats.length}</p>
                        </div>
                    </div>
                </div>

                {/* My Chats List Section */}
                <div className="my-chats-section">
                    <h2>My Created Chats</h2>
                    <div className="my-chats-list">
                        {myChats.length > 0 ? (
                            myChats.map((chat, index) => (
                                <div 
                                    key={chat.sub_chat_id || index} 
                                    className="my-chat-item"
                                    onClick={() => navigate(`/chat?id=${chat.sub_chat_id}`)}
                                >
                                    <div className="my-chat-info">
                                        <h3>{chat.sub_chat_name}</h3>
                                        <span>{new Date(parseInt(chat.timestamp)).toLocaleDateString()}</span>
                                    </div>
                                    <div className="arrow-icon">→</div>
                                </div>
                            ))
                        ) : (
                            <p className="no-chats">No chats found for your account.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;