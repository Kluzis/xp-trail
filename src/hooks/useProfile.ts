import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { Profile, DashboardStats, LevelThreshold } from '@/lib/types';
import { useAnalytics } from './useAnalytics';

export const useProfile = () => {
  const { user, profile: authProfile } = useAuth();
  const { trackEvent } = useAnalytics();
  const [profile, setProfile] = useState<Profile | null>(authProfile);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [levelThresholds, setLevelThresholds] = useState<LevelThreshold[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate level from XP
  const calculateLevel = (xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; tier: string } => {
    if (levelThresholds.length === 0) {
      return { level: 1, currentLevelXp: 0, nextLevelXp: 100, tier: 'bronze' };
    }

    let currentLevel = 1;
    let currentTier = 'bronze';
    
    for (const threshold of levelThresholds) {
      if (xp >= threshold.min_xp) {
        currentLevel = threshold.level;
        currentTier = threshold.tier;
      } else {
        break;
      }
    }

    const currentThreshold = levelThresholds.find(t => t.level === currentLevel);
    const nextThreshold = levelThresholds.find(t => t.level === currentLevel + 1);
    
    return {
      level: currentLevel,
      currentLevelXp: currentThreshold?.min_xp || 0,
      nextLevelXp: nextThreshold?.min_xp || (currentThreshold?.min_xp || 0) + 100,
      tier: currentTier
    };
  };

  // Load level thresholds
  const loadLevelThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from('level_thresholds')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      setLevelThresholds(data || []);
    } catch (err) {
      console.error('Error loading level thresholds:', err);
    }
  };

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's current stats
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get completed lessons count
      const { count: completedLessons, error: lessonsError } = await supabase
        .from('lesson_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (lessonsError) throw lessonsError;

      // Get available skills count
      const { count: availableSkills, error: skillsError } = await supabase
        .from('user_skills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'available');

      if (skillsError) throw skillsError;

      // Get active challenges count
      const { count: activeChallenges, error: challengesError } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('completed_at', null);

      if (challengesError) throw challengesError;

      // Get user's rank
      const { data: rankData, error: rankError } = await supabase
        .rpc('get_user_rank', { user_id: user.id });

      if (rankError) throw rankError;

      const levelInfo = calculateLevel(userProfile.xp);
      
      const dashboardStats: DashboardStats = {
        totalXp: userProfile.xp,
        currentLevel: levelInfo.level,
        nextLevelXp: levelInfo.nextLevelXp,
        currentStreak: userProfile.current_streak,
        completedLessons: completedLessons || 0,
        availableSkills: availableSkills || 0,
        activeChallenges: activeChallenges || 0,
        rank: rankData || 999
      };

      setProfile(userProfile);
      setStats(dashboardStats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  // Award XP and handle level ups
  const awardXP = async (amount: number, source: string, sourceId?: string) => {
    if (!user || !profile) return { success: false, error: 'No user logged in' };

    try {
      const newXp = profile.xp + amount;
      const oldLevel = calculateLevel(profile.xp).level;
      const newLevel = calculateLevel(newXp).level;
      
      // Update profile with new XP
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          xp: newXp,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Track XP award event
      trackEvent('xp_awarded', {
        user_id: user.id,
        amount,
        source,
        source_id: sourceId,
        new_total: newXp
      });

      // Check for level up
      if (newLevel > oldLevel) {
        trackEvent('level_up', {
          user_id: user.id,
          old_level: oldLevel,
          new_level: newLevel,
          total_xp: newXp
        });

        // Check if new skills should be unlocked
        await unlockSkillsForLevel(newLevel);
      }

      setProfile(updatedProfile);
      await loadDashboardStats(); // Refresh stats

      return { 
        success: true, 
        levelUp: newLevel > oldLevel,
        oldLevel,
        newLevel,
        newXp
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to award XP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Unlock skills based on level
  const unlockSkillsForLevel = async (level: number) => {
    if (!user) return;

    try {
      // Get all skills that should be unlocked at this level
      const { data: skillsToUnlock, error: skillsError } = await supabase
        .from('skills')
        .select('id')
        .lte('required_level', level);

      if (skillsError) throw skillsError;

      // Check which skills are not yet in user_skills table
      const { data: existingUserSkills, error: existingError } = await supabase
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', user.id);

      if (existingError) throw existingError;

      const existingSkillIds = existingUserSkills?.map(us => us.skill_id) || [];
      const newSkillsToAdd = skillsToUnlock?.filter(skill => 
        !existingSkillIds.includes(skill.id)
      ) || [];

      if (newSkillsToAdd.length > 0) {
        const userSkillsToInsert = newSkillsToAdd.map(skill => ({
          user_id: user.id,
          skill_id: skill.id,
          status: 'available' as const
        }));

        const { error: insertError } = await supabase
          .from('user_skills')
          .insert(userSkillsToInsert);

        if (insertError) throw insertError;

        // Track skill unlocks
        newSkillsToAdd.forEach(skill => {
          trackEvent('skill_unlocked', {
            user_id: user.id,
            skill_id: skill.id,
            level_required: level
          });
        });
      }
    } catch (err) {
      console.error('Error unlocking skills:', err);
    }
  };

  // Update streak
  const updateStreak = async () => {
    if (!user || !profile) return;

    try {
      const today = new Date().toDateString();
      const lastActive = new Date(profile.last_active_date).toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      let newStreak = profile.current_streak;

      if (lastActive === today) {
        // Already active today, no change
        return;
      } else if (lastActive === yesterday) {
        // Continue streak
        newStreak = profile.current_streak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      const longestStreak = Math.max(profile.longest_streak, newStreak);

      const { error } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_active_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      trackEvent('daily_login', {
        user_id: user.id,
        streak: newStreak,
        is_new_record: newStreak > profile.longest_streak
      });

      if (newStreak > profile.longest_streak) {
        trackEvent('streak_milestone', {
          user_id: user.id,
          streak: newStreak
        });
      }

      setProfile(prev => prev ? {
        ...prev,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_active_date: new Date().toISOString()
      } : null);

    } catch (err) {
      console.error('Error updating streak:', err);
    }
  };

  // Update skin configuration
  const updateSkin = async (skinConfig: Record<string, any>) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          skin_config: skinConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      trackEvent('skin_change', {
        user_id: user.id,
        config: skinConfig
      });

      setProfile(data);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update skin';
      return { success: false, error: errorMessage };
    }
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      loadLevelThresholds();
      loadDashboardStats();
      updateStreak();
    }
  }, [user]);

  // Update profile when auth profile changes
  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
    }
  }, [authProfile]);

  return {
    profile,
    stats,
    loading,
    error,
    awardXP,
    updateSkin,
    updateStreak,
    calculateLevel,
    refreshStats: loadDashboardStats
  };
};