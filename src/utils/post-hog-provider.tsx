// src/utils/posthogClient.ts
'use client';
import posthog from 'posthog-js';

export function initPostHog() {
    if (typeof window !== 'undefined') {
        const consent = localStorage.getItem('cookie_consent');

        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
            autocapture: false,
            capture_pageview: false,
            disable_session_recording: true,
        });

        // Make posthog available globally (for debugging)
        (window as any).posthog = posthog;

        if (consent === 'granted') {
            posthog.opt_in_capturing();
        } else {
            posthog.opt_out_capturing();
        }

        console.log('✅ PostHog initialized');
    }
}
