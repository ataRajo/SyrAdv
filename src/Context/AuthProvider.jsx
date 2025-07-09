import { createContext, useContext, useEffect, useState } from "react";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [permissions , setPermissions] = useState([]);

    useEffect(() => {
        setUser(JSON.parse(localStorage.getItem("SuperAdminInfo")) || {});
        setPermissions(JSON.parse(localStorage.getItem("permissions")) || []);
    }, []);

    const hasPermission = (permission) => {
        if (!user.user) {
            console.log("no user");
            return false; 
        }
        return permissions.some(permissionItem => permissionItem.name === permission);
    };

    return (
        <AuthContext.Provider value={{ user, permissions , hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};