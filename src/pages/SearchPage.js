import React, { use } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import "./SearchPage.css";
const url = process.env.REACT_APP_API_URL;

export default function SearchPage() {
    const [selected, setSelected] = useState("users");
    const [searchTerm, setSearchTerm] = useState("");
    const usersRef = useRef(null);
    const chatsRef = useRef(null);
    const [results, setResults] = useState([]);
    const navigate = useNavigate(); // Hook for navigation

    useEffect(() => {
        if (selected === "users") {
            usersRef.current.classList.add("selected");
            chatsRef.current.classList.remove("selected");
        }
        if (selected === "chats") {
            chatsRef.current.classList.add("selected");
            usersRef.current.classList.remove("selected");
        }
    }, [selected])
    useEffect(() => {
        if (selected === "users" && searchTerm.trim() !== "") {
            const fetchData = async () => {
                setResults([]);
                try {
                    const response = await fetch(`${url}/search-users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), username: searchTerm })
                    });
                    const data = await response.json();
                    if (data.success && data.data) {
                        setResults(data.data);
                        if (data.new_jwt && data.new_jwt !== 'none') {
                            localStorage.setItem("jwt", data.new_jwt.new_jwt);
                        }
                    }
                } catch (error) {
                    alert("Error fetching following: ", error);
                }
            };

            fetchData();
        } else if (selected === "chats") {
            const fetchData = async () => {
                setResults([]);
                try {
                    const response = await fetch(`${url}/search-chats`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jwt: localStorage.getItem("jwt"), refresh: localStorage.getItem("refresh"), name: searchTerm })
                    });
                    const data = await response.json();
                    if (data.success && data.data) {
                        setResults(data.data);
                        if (data.new_jwt && data.new_jwt !== 'none') {
                            localStorage.setItem("jwt", data.new_jwt.new_jwt);
                        }
                    }
                } catch (error) {
                    alert("Error fetching following: ", error);
                }
            };
            fetchData();
        } else {
            setResults([]);
        }

    }, [searchTerm, selected])
    return (
        <div className="search-page">
            <div className="options">
                <button
                    ref={usersRef}
                    className="option-button"
                    onClick={() => setSelected("users")}
                >
                    Search Users
                </button>
                <button
                    ref={chatsRef}
                    className="option-button"
                    onClick={() => setSelected("chats")}
                >
                    Search Chats
                </button>
            </div>
            <input type="text" className="search-title" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="results">
                {searchTerm && selected === "users" &&results.length === 0 && <p className="no-results">No users found.</p>}
                {selected === "users" && results.map((result, index) => (
                    <div key={index} className="result-item" onClick={() => navigate(`/user?name=${result.username}`)}>
                        <img src={url + "/" + result.image_url} alt="pfp" className="result-pfp" />
                        <p>{result.username}</p>
                    </div>
                ))}
                {searchTerm && selected === "chats" && results.length === 0 && <p className="no-results">No chats found.</p>}
                {selected === "chats" && results.map((result, index) => (
                    <div key={index} className="result-item" onClick={() => navigate(`/chat?id=${result.sub_chat_id}`)}>
                        <p>{result.sub_chat_name}</p>
                        <p className="author">By {result.username}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}