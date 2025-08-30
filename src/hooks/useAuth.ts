import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/types';
import { useAnalytics } from './useAnalytics';

export interface AuthState {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            loading: false,
            error: null
          });
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Auth error'
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            loading: false,
            error: null
          });

          if (event === 'SIGNED_IN') {
            trackEvent('daily_login', {
              user_id: session.user.id,
              method: 'email'
            });
          }
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [trackEvent]);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    username: string,
    fullName?: string,
    age?: number
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check if username is available
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        throw new Error('Username already taken');
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            username,
            full_name: fullName,
            age
          });

        if (profileError) throw profileError;

        trackEvent('onboarding_start', {
          user_id: authData.user.id
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        profile: null,
        loading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error('No user logged in');

      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        profile: data,
        loading: false,
        error: null
      }));

      trackEvent('profile_edit', {
        user_id: state.user.id,
        updated_fields: Object.keys(updates)
      });

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reset password failed';
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    resetPassword,
    isAuthenticated: !!state.user,
    isAdmin: state.profile?.role === 'admin'
  };
};