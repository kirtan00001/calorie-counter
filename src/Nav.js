import React from 'react';
import "./Nav.css";

export default function Nav() {
    return (
        <div className="container">
            <nav className="nav">
                <ul className="nav-list">
                    <li><a href="/chats">Home</a></li>
                    <li><a href="/profile">My Profile</a></li>
                    <li><a href="/search">Search</a></li>

                </ul>
            </nav>
        </div>
    );
}