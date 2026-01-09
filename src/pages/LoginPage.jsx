import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

const LoginPage = () => {
    const navigate = useNavigate();

    const handleLogin = (token) => {
        // Token is already saved to localStorage by the Login component
        // We just need to navigate to the dashboard
        navigate('/');
    };

    return <Login onLogin={handleLogin} />;
};

export default LoginPage;
