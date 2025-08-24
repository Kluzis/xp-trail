import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AnalyticsEventType, AnalyticsEventData } from '@/lib/types';
import { useAuth } from './useAuth';

// Session ID for tracking user sessions
let sessionId: string | null = null;

const generateSessionId = () => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return sessionId;
};

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventName: AnalyticsEventType,
    properties: Record<string, any> = {}
  ) => {
    try {
      if (!user) return;

      const eventData: AnalyticsEventData = {
        event_name: eventName,
        properties: {
          ...properties,
          timestamp: Date.now(),
          user_agent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        },
        session_id: generateSessionId()
      };

      // Save to Supabase
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_name: eventName,
          event_data: eventData.properties,
          session_id: eventData.session_id
        });

      if (error) {
        console.error('Analytics error:', error);
      }

      // In production, you could also send to external analytics services
      // like Segment, Amplitude, etc.
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track(eventName, eventData.properties);
      }

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [user]);

  const trackPageView = useCallback((page: string, properties: Record<string, any> = {}) => {
    trackEvent('page_view', {
      page,
      ...properties
    });
  }, [trackEvent]);

  const trackLessonStart = useCallback((lessonId: string, lessonTitle: string) => {
    trackEvent('lesson_start', {
      lesson_id: lessonId,
      lesson_title: lessonTitle
    });
  }, [trackEvent]);

  const trackLessonComplete = useCallback((
    lessonId: string, 
    lessonTitle: string, 
    timeSpent: number,
    xpEarned: number
  ) => {
    trackEvent('lesson_complete', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      time_spent: timeSpent,
      xp_earned: xpEarned
    });
  }, [trackEvent]);

  const trackVideoStart = useCallback((videoId: string, videoTitle: string) => {
    trackEvent('video_start', {
      video_id: videoId,
      video_title: videoTitle
    });
  }, [trackEvent]);

  const trackVideoComplete = useCallback((
    videoId: string, 
    videoTitle: string, 
    watchTime: number,
    totalDuration: number
  ) => {
    trackEvent('video_complete', {
      video_id: videoId,
      video_title: videoTitle,
      watch_time: watchTime,
      total_duration: totalDuration,
      completion_rate: totalDuration > 0 ? (watchTime / totalDuration) * 100 : 0
    });
  }, [trackEvent]);

  const trackXpAwarded = useCallback((amount: number, source: string, sourceId?: string) => {
    trackEvent('xp_awarded', {
      amount,
      source,
      source_id: sourceId
    });
  }, [trackEvent]);

  const trackLevelUp = useCallback((newLevel: number, totalXp: number) => {
    trackEvent('level_up', {
      new_level: newLevel,
      total_xp: totalXp
    });
  }, [trackEvent]);

  const trackSkillUnlocked = useCallback((skillId: string, skillName: string, requiredLevel: number) => {
    trackEvent('skill_unlocked', {
      skill_id: skillId,
      skill_name: skillName,
      required_level: requiredLevel
    });
  }, [trackEvent]);

  const trackChallengeComplete = useCallback ((challengeId: string, challengeTitle: string, xpEarned: number) => {
    trackEvent('challenge_complete', {
      challenge_id: challengeId,
      challenge_title: challengeTitle,
      xp_earned: xpEarned
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, results: number) => {
    trackEvent('search', {
      query,
      results_count: results
    });
  }, [trackEvent]);

  const trackSkinChange = useCallback((skinConfig: Record<string, any>) => {
    trackEvent('skin_change', {
      skin_config: skinConfig
    });
  }, [trackEvent]);

  const trackStreakMilestone = useCallback((streakLength: number) => {
    trackEvent('streak_milestone', {
      streak_length: streakLength
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackLessonStart,
    trackLessonComplete,
    trackVideoStart,
    trackVideoComplete,
    trackXpAwarded,
    trackLevelUp,
    trackSkillUnlocked,
    trackChallengeComplete,
    trackSearch,
    trackSkinChange,
    trackStreakMilestone,
    sessionId: generateSessionId()
  };
};

// Initialize analytics on app start
export const initializeAnalytics = () => {
  generateSessionId();
  
  // Track page views automatically
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    // Dispatch custom event for page view tracking
    window.dispatchEvent(new CustomEvent('analytics:page-view', {
      detail: { url: window.location.href }
    }));
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    window.dispatchEvent(new CustomEvent('analytics:page-view', {
      detail: { url: window.location.href }
    }));
  };

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new CustomEvent('analytics:page-view', {
      detail: { url: window.location.href }
    }));
  });
};