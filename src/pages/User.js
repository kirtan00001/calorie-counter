import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./User.css"; 

const url = process.env.REACT_APP_API_URL;

const User_Page = () => {
    const [searchParams] = useSearchParams();
    const targetUsername = searchParams.get("name");
    const [myUsername, setMyUsername] = useState("");
    const [userChats, setUserChats] = useState([]);
    const [pfpUrl, setPfpUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const followBtnRef = useRef(null);
    const navigate = useNavigate();
    const defaultPfp = `${url}/uploads/users/default.png`;
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    useEffect(() => {
        if (!targetUsername) {
            navigate("/chats");
            return;
        }
        const updateToken = (newJwt_) => {
            const newJwt = newJwt_.new_jwt;
            if (newJwt && newJwt !== 'none') {
                localStorage.setItem("jwt", newJwt);
            }
        };
        
        const checkFollowing = async (me) => {
            const infoRes = await fetch(`${url}/get-followers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), username: targetUsername })
            });
            const infoData = await infoRes.json();
            setFollowersCount(infoData.data.length);
            
            const isFollowing = infoData.data.some(follower => follower.follower == me);        
            if (isFollowing) {


            setIsFollowing(true);
            setFollowersCount(followersCount + 1); 
            } else {

                setIsFollowing(false);
 
            }
            const infoRes1 = await fetch(`${url}/get-following`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), username: targetUsername })
            });
            const infoData1 = await infoRes1.json();
            setFollowingCount(infoData1.data.length);
        };

        const fetchMyData = async () => {
            const jwt = localStorage.getItem("jwt");
            const refresh = localStorage.getItem("refresh");

            try {
                const infoRes = await fetch(`${url}/get-my-info`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh })
                });
                const infoData = await infoRes.json();

                if (infoData.success) {
                    setMyUsername(infoData.user)
                    updateToken(infoData.new_jwt);
                    return infoData.user
                }
                
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };
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
                    updateToken(infoData.new_jwt);
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
const loadData = async () => {
const me = await fetchMyData(); // Capture the return value
    await fetchUserData();
    await checkFollowing(me);       // Pass it here
    };

    loadData();

        return () => { if (pfpUrl) URL.revokeObjectURL(pfpUrl); };

    }, [targetUsername, navigate]);

    if (loading) {
        return <div className="profile-page-container"><h1>Loading Profile...</h1></div>;
    }
    const followUser = async () => {
        const jwt = localStorage.getItem("jwt");
        const refresh = localStorage.getItem("refresh");
                try {
                const infoRes = await fetch(`${url}/follow-user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh, user_to_follow: targetUsername })
                });
                const data = await infoRes.json();

                if (data.success) {
            if (data.new_jwt && data.new_jwt !== 'none') {
                localStorage.setItem("jwt", data.new_jwt);
            }                
            setIsFollowing(true);
            setFollowersCount(followersCount + 1); 

        } else alert (data.message || "Failed to follow user. Please try again.");

            } catch (error) {
                alert("Error following user. Please try again.");
            }
    };
    const unfollowUser = async () => {
        const jwt = localStorage.getItem("jwt");
        const refresh = localStorage.getItem("refresh");
try {
                const infoRes = await fetch(`${url}/unfollow-user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh, user_to_unfollow: targetUsername })
                });

 
                const data = await infoRes.json();
                if (data.success) {
            if (data.new_jwt && data.new_jwt !== 'none') {
                localStorage.setItem("jwt", data.new_jwt);
            }          
                            setFollowersCount(followersCount - 1); 
        } else alert (data.message || "Failed to unfollow user. Please try again.");

            } catch (error) {
                alert("Error unfollowing user. Please try again.");
            }
        setIsFollowing(false);

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
                    <div className="profile-stats-next">
                        <div onClick={() => navigate(`/followers?id=${targetUsername}`)} className="stat-box-next">
                        <span>Followers</span>
                        <p>{followersCount}</p>
                        </div>
                    </div>
                    <div className="profile-stats-next">
                        <div onClick={() => navigate(`/following?id=${targetUsername}`)} className="stat-box-next">
                            <span>Following</span>
                            <p>{followingCount}</p>
                        </div>
                    </div>
                    <div className="profile-stats">
                        <div className="stat-box">
                            <span>Total Messages</span>
                            <p>{userChats.length}</p>

                        </div>
                        {myUsername !== targetUsername && ( 
                            <>
                            <button className="menu-btn" onClick={() => navigate(`/dm?id=${targetUsername}`)}>
                                DM
                            </button>
                            <button ref={followBtnRef} className="menu-btn" onClick={isFollowing ? unfollowUser : followUser} style={{
                                backgroundColor: isFollowing ? "red" : "#2a78c9"
                            }}>
                                {isFollowing ? "Unfollow" : "Follow"}
                            </button>
                            </>
                        )}
                        
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