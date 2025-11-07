/**
 * AI Switch Test Utility
 * Used to test AI Analysis switch functionality
 */

import { useTodoStore } from '../store/todoStore';

export const testAISwitch = () => {
    const { aiAnalysisEnabled, setAiAnalysisEnabled } = useTodoStore.getState();

    console.log('=== AI Analysis Switch Test ===');
    console.log('Current AI Analysis Status:', aiAnalysisEnabled ? 'ENABLED' : 'DISABLED');

    // Test toggling the switch
    console.log('Toggling AI Analysis switch...');
    setAiAnalysisEnabled(!aiAnalysisEnabled);

    const newState = useTodoStore.getState().aiAnalysisEnabled;
    console.log('New AI Analysis Status:', newState ? 'ENABLED' : 'DISABLED');

    // Test what happens when AI is disabled
    if (!newState) {
        console.log('✅ AI Analysis is now DISABLED');
        console.log('Expected behavior:');
        console.log('- Task analysis will use basic templates');
        console.log('- AI priority scoring will be skipped');
        console.log('- AI Priority UI elements will be hidden');
        console.log('- Voice-to-task will use basic analysis');
    } else {
        console.log('✅ AI Analysis is now ENABLED');
        console.log('Expected behavior:');
        console.log('- Task analysis will use AI/Gemini API');
        console.log('- AI priority scoring will be available');
        console.log('- AI Priority UI elements will be visible');
        console.log('- Voice-to-task will use AI analysis');
    }

    return {
        previousState: aiAnalysisEnabled,
        currentState: newState,
        toggled: true
    };
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
    (window as any).testAISwitch = testAISwitch;
}
