import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Login = ({ onLogin }) => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!token.trim().startsWith('pk_')) {
            setError('Token must start with "pk_"');
            return;
        }
        
        // Save to local storage
        localStorage.setItem('clickup_access_token', token.trim());
        
        // Notify parent
        if (onLogin) {
            onLogin(token.trim());
        } else {
             window.location.reload();
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            color: '#fff'
        }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ 
                    padding: '2.5rem', 
                    textAlign: 'center',
                    maxWidth: '450px',
                    width: '100%'
                }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: 'linear-gradient(135deg, #7b2cbf 0%, #3b82f6 100%)',
                        borderRadius: '16px',
                        margin: '0 auto 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                    }}>
                        C
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>ClickUp Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your Personal API Token to continue.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <input 
                            type="password" 
                            placeholder="pk_..." 
                            value={token}
                            onChange={(e) => {
                                setToken(e.target.value);
                                setError('');
                            }}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${error ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                        {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
                    </div>

                    <button 
                        type="submit"
                        disabled={!token}
                        style={{
                            background: token ? '#7b68ee' : 'rgba(255,255,255,0.1)',
                            color: token ? 'white' : 'rgba(255,255,255,0.3)',
                            border: 'none',
                            padding: '0.875rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: token ? 'pointer' : 'not-allowed',
                            width: '100%',
                            transition: 'all 0.2s',
                        }}
                    >
                        Login
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <p>To find your token:</p>
                    <ol style={{ textAlign: 'left', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                        <li>Click your profile avatar (top right / bottom left)</li>
                        <li>Go to <strong>Settings</strong> &gt; <strong>Apps</strong></li>
                        <li>Generate an API Token</li>
                    </ol>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
