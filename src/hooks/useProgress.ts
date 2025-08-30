import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { supabase } from '@/integrations/supabase/client';
import { LessonCompletion, UserSkill, UserChallenge } from '@/lib/types';
import { useAnalytics } from './useAnalytics';

export const useProgress = () => {
  const { user } = useAuth();
  const { awardXP } = useProfile();
  const { trackEvent } = useAnalytics();
  const [completedLessons, setCompletedLessons] = useState<LessonCompletion[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's completed lessons
  const loadCompletedLessons = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_completions')
        .select(`
          *,
          lesson:lessons (
            id,
            title,
            category_id,
            xp_reward,
            difficulty_level,
            category:categories (
              id,
              name,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setCompletedLessons(data || []);
    } catch (err) {
      console.error('Error loading completed lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load completed lessons');
    }
  };

  // Load user's skills progress
  const loadUserSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          *,
          skill:skills (
            id,
            name,
            description,
            icon_url,
            required_level,
            x_position,
            y_position
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUserSkills(data || []);
    } catch (err) {
      console.error('Error loading user skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user skills');
    }
  };

  // Load user's challenges progress
  const loadUserChallenges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:challenges (
            id,
            title,
            description,
            type,
            xp_reward,
            target_value,
            start_date,
            end_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserChallenges(data || []);
    } catch (err) {
      console.error('Error loading user challenges:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user challenges');
    }
  };

  // Complete a lesson
  const completeLesson = async (lessonId: string, timeSpentSeconds?: number) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      setLoading(true);

      // Check if lesson is already completed
      const { data: existingCompletion } = await supabase
        .from('lesson_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      if (existingCompletion) {
        return { success: false, error: 'Lesson already completed' };
      }

      // Get lesson details for XP reward
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('xp_reward, title')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      // Record completion
      const { data: completion, error: completionError } = await supabase
        .from('lesson_completions')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          xp_earned: lesson.xp_reward,
          time_spent_seconds: timeSpentSeconds,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (completionError) throw completionError;

      // Award XP
      const xpResult = await awardXP(lesson.xp_reward, 'lesson_completion', lessonId);

      // Track lesson completion
      trackEvent('lesson_complete', {
        user_id: user.id,
        lesson_id: lessonId,
        lesson_title: lesson.title,
        xp_earned: lesson.xp_reward,
        time_spent: timeSpentSeconds
      });

      // Update progress for challenges
      await updateChallengeProgress('lesson_complete', 1);

      // Refresh data
      await loadCompletedLessons();

      return { 
        success: true, 
        completion,
        xpResult
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete lesson';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Complete a skill
  const completeSkill = async (skillId: string) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      setLoading(true);

      // Update skill status to completed
      const { data, error } = await supabase
        .from('user_skills')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('skill_id', skillId)
        .select(`
          *,
          skill:skills (
            id,
            name,
            description
          )
        `)
        .single();

      if (error) throw error;

      trackEvent('skill_unlocked', {
        user_id: user.id,
        skill_id: skillId,
        skill_name: data.skill?.name
      });

      await loadUserSkills();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete skill';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update challenge progress
  const updateChallengeProgress = async (eventType: string, value: number) => {
    if (!user) return;

    try {
      // Get active challenges that match the event type
      const { data: activeChallenges, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:challenges (
            id,
            title,
            type,
            xp_reward,
            target_value
          )
        `)
        .eq('user_id', user.id)
        .is('completed_at', null);

      if (error) throw error;

      for (const userChallenge of activeChallenges || []) {
        // Simple mapping of event types to challenge types
        const challengeEventMap: Record<string, string[]> = {
          'daily': ['lesson_complete', 'video_complete'],
          'weekly': ['lesson_complete', 'video_complete', 'skill_complete'],
          'special': ['lesson_complete', 'video_complete', 'skill_complete']
        };

        if (challengeEventMap[userChallenge.challenge?.type || '']?.includes(eventType)) {
          const newProgress = userChallenge.current_progress + value;
          const target = userChallenge.challenge?.target_value || 1;

          let updates: any = {
            current_progress: Math.min(newProgress, target)
          };

          // Check if challenge is completed
          if (newProgress >= target && !userChallenge.completed_at) {
            updates.completed_at = new Date().toISOString();
            
            // Award XP for challenge completion
            await awardXP(
              userChallenge.challenge?.xp_reward || 0, 
              'challenge_completion', 
              userChallenge.challenge?.id
            );

            trackEvent('challenge_complete', {
              user_id: user.id,
              challenge_id: userChallenge.challenge?.id,
              challenge_title: userChallenge.challenge?.title,
              xp_earned: userChallenge.challenge?.xp_reward
            });
          }

          // Update challenge progress
          await supabase
            .from('user_challenges')
            .update(updates)
            .eq('id', userChallenge.id);
        }
      }

      await loadUserChallenges();
    } catch (err) {
      console.error('Error updating challenge progress:', err);
    }
  };

  // Get lesson completion status
  const isLessonCompleted = (lessonId: string): boolean => {
    return completedLessons.some(completion => completion.lesson_id === lessonId);
  };

  // Get skill status
  const getSkillStatus = (skillId: string): 'locked' | 'available' | 'completed' => {
    const userSkill = userSkills.find(us => us.skill_id === skillId);
    return userSkill?.status || 'locked';
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      loadCompletedLessons();
      loadUserSkills();
      loadUserChallenges();
    }
  }, [user]);

  return {
    completedLessons,
    userSkills,
    userChallenges,
    loading,
    error,
    completeLesson,
    completeSkill,
    updateChallengeProgress,
    isLessonCompleted,
    getSkillStatus,
    refreshProgress: () => {
      loadCompletedLessons();
      loadUserSkills();
      loadUserChallenges();
    }
  };
};