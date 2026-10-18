import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { StorageService } from '../services/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchAllUsers();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchAllUsers();
      } else {
        setCurrentUser(null);
        setAllUsers([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      const u = data || {};
      const user = {
        ...u,
        name: u.name || (u.email ? u.email.split('@')[0] : 'User'),
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email || 'User')}&background=random`,
      };
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      // Memetakan ke format lama (name, id, role, dll)
      const mapped = (data || []).map((p) => ({
        ...p,
        id: p.id,
        name: p.name || (p.email ? p.email.split('@')[0] : 'User'),
        avatar:
          p.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            p.name || p.email || 'User'
          )}&background=random`,
        email: p.email,
        role: p.role,
        division:
          p.division ||
          (p.role === 'developer' || p.role === 'marketing' ? p.role : 'management'),
      }));
      setAllUsers(mapped);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const switchUser = (userId) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const login = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Mock checking permissions
  const hasPermission = (action, resource, item = null) => {
    return { allowed: true }; // Simplified for now
  };

  const requirePermission = (action, resource, item = null) => {
    return true; // Simplified for now
  };

  const clearAccessDenied = () => {
    setAccessDeniedMessage(null);
  };

  const value = {
    currentUser,
    allUsers,
    loading,
    login,
    logout,
    switchUser,
    isOwner: currentUser?.role === 'owner',
    isDeveloper: currentUser?.role === 'developer',
    isMarketing: currentUser?.role === 'marketing',
    hasPermission,
    requirePermission,
    accessDeniedMessage,
    clearAccessDenied,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
