import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            try {
                const userObj = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(userObj);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        setIsAuthenticated(true);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            loading,
            login,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;

