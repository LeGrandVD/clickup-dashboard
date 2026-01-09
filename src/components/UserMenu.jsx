import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserMenu = ({ user, onLogout, onSettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div style={{ position: 'relative' }} ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                {user?.profilePicture ? (
                    <img 
                        src={user.profilePicture} 
                        alt={user.username} 
                        style={{
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.1)'
                        }} 
                    />
                ) : (
                    <div style={{
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        background: user?.color || '#7b68ee',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        border: '2px solid rgba(255,255,255,0.1)'
                    }}>
                        {getInitials(user?.username)}
                    </div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            width: '200px',
                            background: '#1e1b4b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                            zIndex: 50,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'white' }}>{user?.username}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
                        </div>
                        
                        <div style={{ padding: '0.5rem' }}>
                            <button
                                onClick={() => {
                                    onSettings();
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    borderRadius: '0.5rem',
                                    textAlign: 'left'
                                }}
                                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseOut={(e) => e.target.style.background = 'none'}
                            >
                                <Settings size={16} />
                                Settings
                            </button>
                            
                            <button
                                onClick={onLogout}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: 'none',
                                    background: 'none',
                                    color: '#ef4444',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    borderRadius: '0.5rem',
                                    textAlign: 'left'
                                }}
                                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseOut={(e) => e.target.style.background = 'none'}
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserMenu;
