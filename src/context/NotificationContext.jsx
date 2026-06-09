import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        const notification = {
            id,
            message,
            type // 'success', 'error', 'warning', 'info'
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-remove after duration
        if (duration) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, []);

    const success = useCallback((message, duration) => {
        return addNotification(message, 'success', duration);
    }, [addNotification]);

    const error = useCallback((message, duration) => {
        return addNotification(message, 'error', duration);
    }, [addNotification]);

    const warning = useCallback((message, duration) => {
        return addNotification(message, 'warning', duration);
    }, [addNotification]);

    const info = useCallback((message, duration) => {
        return addNotification(message, 'info', duration);
    }, [addNotification]);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            removeNotification,
            success,
            error,
            warning,
            info,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export default NotificationContext;

