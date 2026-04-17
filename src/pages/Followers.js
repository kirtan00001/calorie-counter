import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import "./Follow.css";

const url = process.env.REACT_APP_API_URL;

// Sub-component to handle individual user PFP fetching
const FollowerItem = ({ username, navigate }) => {
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
                console.error("Error loading pfp for", username);
            }
        };
        fetchPfp();
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

const FollowersPage = () => {
    const [followers, setFollowers] = useState([]);
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

        const fetchFollowers = async () => {
            try {
                const response = await fetch(`${url}/get-followers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt, refresh, username: name })
                });
                const data = await response.json();
                
                if (data.success) {
                    setFollowers(data.data || []);
                    if (data.new_jwt && data.new_jwt !== 'none') {
                        localStorage.setItem("jwt", data.new_jwt);
                    }
                }
            } catch (error) { 
                console.error("Error fetching followers: ", error); 
            }
        };

        fetchFollowers();
    }, [navigate, name]);

    return (
        <div className="following-container">
            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <h2 className="following-title">Followers</h2>
            <p className="following-subtitle">Users following <b>{name}</b></p>
            
            <div className="following-list">
                {followers.length > 0 ? (
                    followers.map((user, index) => (
                        <FollowerItem 
                            key={index} 
                            username={user.follower || "Unknown"} 
                            navigate={navigate} 
                        />
                    ))
                ) : (
                    <p className="no-following">No followers found.</p>
                )}
            </div>
        </div>
    );
};

export default FollowersPage;