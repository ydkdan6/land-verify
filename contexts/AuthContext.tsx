import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: Profile['role'], phone?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing authentication...');
    
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('🔐 AuthProvider: Initial session check', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: error ? JSON.stringify(error, null, 2) : null 
        });
        
        if (error) {
          console.error('🔐 AuthProvider: Error getting initial session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔐 AuthProvider: User found, fetching profile for:', session.user.id);
          fetchProfile(session.user.id);
        } else {
          console.log('🔐 AuthProvider: No user session, setting loading to false');
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('🔐 AuthProvider: Unexpected error getting session:', error);
        setLoading(false);
      });

    // Listen for auth changes
    console.log('🔐 AuthProvider: Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthProvider: Auth state changed', { 
          event, 
          hasSession: !!session, 
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔐 AuthProvider: Auth change - fetching profile for:', session.user.id);
          await fetchProfile(session.user.id);
        } else {
          console.log('🔐 AuthProvider: Auth change - no user, clearing profile');
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🔐 AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('👤 fetchProfile: Starting profile fetch for userId:', userId);
    setLoading(true);
    
    try {
      console.log('👤 fetchProfile: Querying user_profiles table...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('👤 fetchProfile: Query result', {
        hasData: !!data,
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: JSON.stringify(error, null, 2)
        } : null,
        data: data ? { ...data, id: '***masked***' } : null
      });

      if (error) {
        console.error('👤 fetchProfile: Database error fetching profile:', {
          userId,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          fullError: error
        });
        
        // Check if it's a table not found error
        if (error.code === '42P01') {
          console.error('👤 fetchProfile: TABLE NOT FOUND - user_profiles table does not exist!');
          console.error('👤 fetchProfile: Please check your database schema or table name');
        }
      } else {
        console.log('👤 fetchProfile: Successfully fetched profile');
        setProfile(data);
      }
    } catch (error) {
      console.error('👤 fetchProfile: Unexpected error:', {
        userId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
    } finally {
      console.log('👤 fetchProfile: Setting loading to false');
      setLoading(false);
    }
  };

  

// Add this debug function to your auth context file
// Call it before attempting signup to verify your Supabase setup

const debugSupabaseConnection = async () => {
  console.log('🔍 Debug: Checking Supabase configuration...');
  
  // // 1. Check configuration
  // console.log('🔍 Debug: Supabase URL:', supabase.supabaseUrl);
  // console.log('🔍 Debug: Supabase Key:', supabase.supabaseKey ? 'Present' : 'Missing');
  
  // 2. Test basic connectivity
  try {
    console.log('🔍 Debug: Testing basic connection...');
    const { data, error } = await supabase.auth.getSession();
    console.log('🔍 Debug: getSession result:', { 
      success: !error, 
      error: error?.message 
    });
  } catch (err) {
    console.error('🔍 Debug: Connection test failed:', err);
  }
  
  // 3. Test database connectivity
  try {
    console.log('🔍 Debug: Testing database connection...');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    console.log('🔍 Debug: Database test result:', { 
      success: !error, 
      error: error?.message 
    });
  } catch (err) {
    console.error('🔍 Debug: Database test failed:', err);
  }
  
  // 4. Check network
  // try {
  //   console.log('🔍 Debug: Testing direct fetch to Supabase...');
  //   const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
  //     headers: {
  //       'apikey': supabase.supabaseKey,
  //       'Authorization': `Bearer ${supabase.supabaseKey}`
  //     }
  //   });
  //   console.log('🔍 Debug: Direct fetch result:', {
  //     status: response.status,
  //     statusText: response.statusText,
  //     headers: Object.fromEntries(response.headers.entries())
  //   });
    
  //   const text = await response.text();
  //   console.log('🔍 Debug: Response body preview:', text.substring(0, 200));
  // } catch (err) {
  //   console.error('🔍 Debug: Direct fetch failed:', err);
  // }
};

// Modified signUp function with better error handling
const signUp = async (email: string, password: string, fullName: string, role: Profile['role'], phone?: string) => {
  console.log('📝 signUp: Starting signup process', { 
    email, 
    fullName, 
    role, 
    hasPhone: !!phone 
  });
  
  // Add debug check
  await debugSupabaseConnection();
  
  try {
    console.log('📝 signUp: Calling Supabase auth.signUp...');
    
    // Add request interceptor to see what's being sent
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      console.log('📝 signUp: Intercepted fetch request:', {
        url: args[0],
        method: args[1]?.method,
        headers: args[1]?.headers
      });
      const response = await originalFetch(...args);
      console.log('📝 signUp: Intercepted fetch response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return response;
    };
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    // Restore original fetch
    window.fetch = originalFetch;

    console.log('📝 signUp: Auth signup result', {
      hasUser: !!data.user,
      userId: data.user?.id,
      userEmail: data.user?.email,
      needsConfirmation: !!data.user && !data.session,
      error: error ? {
        message: error.message,
        status: error.status,
        name: error.name,
        full: JSON.stringify(error, null, 2)
      } : null
    });

    if (error) {
      console.error('📝 signUp: Auth signup failed:', error);
      throw error;
    }

    // Rest of your signup logic...
    if (data.user) {
      console.log('📝 signUp: User created, creating profile...');
      const profileData = {
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        phone: phone || null,
      };
      
      console.log('📝 signUp: Profile data to insert:', { 
        ...profileData, 
        id: '***masked***' 
      });
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData);

      if (profileError) {
        console.error('📝 signUp: Profile creation failed:', profileError);
        throw profileError;
      }
      
      console.log('📝 signUp: Signup completed successfully');
    }
  } catch (error) {
    console.error('📝 signUp: Unexpected error during signup:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    throw error;
  }
};

  const signIn = async (email: string, password: string) => {
    console.log('🔑 signIn: Starting signin process for:', email);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔑 signIn: Signin result', {
        success: !error,
        error: error ? {
          message: error.message,
          status: error.status,
          full: JSON.stringify(error, null, 2)
        } : null
      });

      if (error) {
        console.error('🔑 signIn: Signin failed:', error);
        throw error;
      }
      
      console.log('🔑 signIn: Signin successful');
    } catch (error) {
      console.error('🔑 signIn: Unexpected error during signin:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 signOut: Starting signout process');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      console.log('🚪 signOut: Signout result', {
        success: !error,
        error: error ? JSON.stringify(error, null, 2) : null
      });
      
      if (error) {
        console.error('🚪 signOut: Signout failed:', error);
        throw error;
      }
      
      console.log('🚪 signOut: Signout successful');
    } catch (error) {
      console.error('🚪 signOut: Unexpected error during signout:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    console.log('✏️ updateProfile: Starting profile update', { 
      updates: { ...updates, id: updates.id ? '***masked***' : undefined },
      hasUser: !!user,
      userId: user?.id
    });
    
    if (!user) {
      const error = new Error('No user logged in');
      console.error('✏️ updateProfile: Failed - no user logged in');
      throw error;
    }

    try {
      console.log('✏️ updateProfile: Updating user_profiles table...');
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      console.log('✏️ updateProfile: Update result', {
        success: !error,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          full: JSON.stringify(error, null, 2)
        } : null
      });

      if (error) {
        console.error('✏️ updateProfile: Update failed:', error);
        throw error;
      }

      console.log('✏️ updateProfile: Update successful, refreshing profile...');
      // Refresh profile
      await fetchProfile(user.id);
      console.log('✏️ updateProfile: Profile refresh completed');
    } catch (error) {
      console.error('✏️ updateProfile: Unexpected error during update:', error);
      throw error;
    }
  };

  console.log('🔐 AuthProvider: Rendering with state', {
    hasSession: !!session,
    hasUser: !!user,
    hasProfile: !!profile,
    loading,
    userId: user?.id,
    userEmail: user?.email,
    profileRole: profile?.role
  });

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}