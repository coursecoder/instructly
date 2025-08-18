'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth';

/**
 * SessionTimeout component monitors user activity and manages automatic logout
 * This component should be included at the app level to track all user interactions
 */
export default function SessionTimeout() {
  const { isAuthenticated, updateActivity } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Array of events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle function to limit how often updateActivity is called
    let lastActivityUpdate = 0;
    const throttleMs = 30000; // Update activity at most once per 30 seconds

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityUpdate > throttleMs) {
        lastActivityUpdate = now;
        updateActivity();
      }
    };

    // Add event listeners for all activity events
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, handleActivity, true);
    });

    // Initial activity update when component mounts
    updateActivity();

    // Cleanup event listeners on unmount or when authentication status changes
    return () => {
      activityEvents.forEach(eventType => {
        document.removeEventListener(eventType, handleActivity, true);
      });
    };
  }, [isAuthenticated, updateActivity]);

  // This component doesn't render anything - it's purely for side effects
  return null;
}