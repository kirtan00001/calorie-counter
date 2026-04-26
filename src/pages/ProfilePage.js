import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import "./ProfilePage.css";

const url = process.env.REACT_APP_API_URL;

const ProfilePage = () => {
    const navigate = useNavigate();
    const defaultPfp = `${url}/uploads/users/default.png`;

    // --- State ---
    const [pfpUrl, setPfpUrl] = useState(null);
    const [myChats, setMyChats] = useState([]);
    const [userData, setUserData] = useState("User");
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // --- Token Management ---
    // Pulls fresh tokens every time to avoid stale closure bugs
    const getAuth = () => ({
        jwt: localStorage.getItem("jwt"),
        refresh: localStorage.getItem("refresh")
    });

    const updateToken = useCallback((data) => {
        const newJwt = data?.new_jwt;
        if (newJwt && newJwt !== 'none') {
            localStorage.setItem("jwt", newJwt);
        }
    }, []);

    // --- API Logic ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        let blobUrl = null;

        try {
            const { jwt, refresh } = getAuth();
            if (!jwt || !refresh) {
                navigate("/login");
                return;
            }

            // 1. Fetch User Info (Sequential to get the username first)
            const infoRes = await fetch(`${url}/get-my-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt, refresh })
            });
            const infoData = await infoRes.json();
            
            if (!infoRes.ok) throw new Error("Failed to fetch user info");
            
            const username = infoData.user;
            setUserData(username);
            updateToken(infoData);

            // 2. Run remaining fetches in parallel for speed
            const [pfpRes, chatsRes, followersRes, followingRes] = await Promise.all([
                fetch(`${url}/get-my-pfp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh") })
                }),
                fetch(`${url}/get-my-chats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh") })
                }),
                fetch(`${url}/get-followers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), username })
                }),
                fetch(`${url}/get-following`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), username })
                })
            ]);

            // Handle PFP Blob
            if (pfpRes.ok) {
                const blob = await pfpRes.blob();
                blobUrl = URL.createObjectURL(blob);
                setPfpUrl(blobUrl);
            }

            // Handle Chats
            const chatsData = await chatsRes.json();
            setMyChats(chatsData.data || []);
            updateToken(chatsData);

            // Handle Follow Stats
            const fersData = await followersRes.json();
            const fingData = await followingRes.json();
            setFollowersCount(fersData.data?.length || 0);
            setFollowingCount(fingData.data?.length || 0);

        } catch (error) {
            console.error("Profile Load Error:", error);
        } finally {
            setIsLoading(false);
        }

        // Cleanup function for the blob URL
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [navigate, updateToken]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div className="profile-page-container"><h1>Loading...</h1></div>;
    }

// ... (keep all your existing state and logic the same)

    return (
        <div className="profile-page-container">
            <button className="back-btn" onClick={() => navigate("/chats")}>
                ← Back to Chats
            </button>
            
            <div className="profile-content-wrapper">
                <div className="profile-card">
                    <img 
                        src={pfpUrl || defaultPfp} 
                        alt="Profile" 
                        className="large-profile-pfp"
                        onError={(e) => { e.target.src = defaultPfp; }}
                    />
                    <h1>{userData}</h1> 

                    {/* ADDED INLINE FLEX SPACING HERE */}
                    <div className="stats-row" style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '30px',      // Adjust this for more/less space
                        marginTop: '20px' 
                    }}>
                        <div onClick={() => navigate(`/followers?id=${userData}`)} className="stat-box-next" style={{ cursor: 'pointer' }}>
                            <span>Followers</span>
                            <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{followersCount}</p>
                        </div>
                        
                        <div onClick={() => navigate(`/following?id=${userData}`)} className="stat-box-next" style={{ cursor: 'pointer' }}>
                            <span>Following</span>
                            <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{followingCount}</p>
                        </div>
                        
                        <div className="stat-box" style={{ textAlign: 'center' }}>
                            <span>Posts</span>
                            <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{myChats.length}</p>
                        </div>
                    </div>
                </div>

                <div className="my-chats-section">
                    <h2>My Created Chats</h2>
                    <div className="my-chats-list">
                        {myChats.length > 0 ? (
                            myChats.map((chat) => (
                                <div 
                                    key={chat.sub_chat_id} 
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