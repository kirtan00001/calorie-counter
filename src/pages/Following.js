import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import "./Follow.css";

const url = process.env.REACT_APP_API_URL;

// Sub-component to handle individual Following user PFP fetching
const FollowingItem = ({ username, navigate }) => {
    const [pfp, setPfp] = useState(null);
    const defaultPfp = `${url}/uploads/users/default.png`;

    useEffect(() => {
        const fetchPfp = async () => {
            const jwt = localStorage.getItem("jwt");
            const refresh = localStorage.getItem("refresh");
            try {
                const res = await fetch(`${url}/get-user-pfp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh, username })
                });
                if (res.ok) {
                    const blob = await res.blob();
                    if (blob.size > 0) {
                        setPfp(URL.createObjectURL(blob));
                    }
                    
                }
            } catch (e) {
                alert("Error loading pfp for", username);
            }
        };
        fetchPfp();
        // Cleanup URL to prevent memory leaks
        return () => { if (pfp) URL.revokeObjectURL(pfp); };
    }, [username]);

    return (
        <div className="following-item" onClick={() => navigate(`/user?name=${username}`)}>
            <div className="following-avatar-container">
                <img 
                    src={pfp || defaultPfp} 
                    alt={username} 
                    className="following-avatar-img"
                    onError={(e) => { e.target.src = defaultPfp; }}
                />
            </div>
            <span className="following-name">{username}</span>
            <div className="view-arrow">→</div>
        </div>
    );
};

const FollowingPage = () => {
    const [following, setFollowing] = useState([]);
    const [searchParams] = useSearchParams();
    const name = searchParams.get("id");
    const navigate = useNavigate();

    useEffect(() => {
        if (!name || name.trim() === "") {
            navigate("/chats");
            return;
        }

        const jwt = localStorage.getItem("jwt");
        const refresh = localStorage.getItem("refresh");

        if (!jwt || !refresh) {
            navigate("/login");
            return;
        }

        const fetchFollowing = async () => {
            try {
                const response = await fetch(`${url}/get-following`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh, username: name })
                });
                const data = await response.json();
                
                if (data.success) {
                    setFollowing(data.data || []);
                    if (data.new_jwt && data.new_jwt !== 'none') {
                        localStorage.setItem("jwt", data.new_jwt.new_jwt);
                    }
                }
            } catch (error) { 
                alert("Error fetching following: ", error); 
            }
        };

        fetchFollowing();
    }, [navigate, name]);

    return (
        <div className="following-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <h2 className="following-title">Following</h2>
            <p className="following-subtitle">Users followed by <b>{name}</b></p>
            
            <div className="following-list">
                {following.length > 0 ? (
                    following.map((user, index) => (
                        <FollowingItem 
                            key={index} 
                            username={user.following || "Unknown User"} 
                            navigate={navigate} 
                        />
                    ))
                ) : (
                    <p className="no-following">This user isn't following anyone yet.</p>
                )}
            </div>
        </div>
    );
};

export default FollowingPage;