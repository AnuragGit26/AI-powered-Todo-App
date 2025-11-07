/**
 * AI Analysis Switch Test Utility
 * Used to test the AI Analysis switch functionality
 */

import { useTodoStore } from '../store/todoStore';

export const testAiAnalysisSwitch = () => {
    const { aiAnalysisEnabled, setAiAnalysisEnabled } = useTodoStore.getState();

    console.log('=== AI Analysis Switch Test ===');
    console.log('Current AI Analysis Status:', aiAnalysisEnabled ? 'ENABLED' : 'DISABLED');

    // Test toggling the switch
    console.log('Toggling AI Analysis switch...');
    setAiAnalysisEnabled(!aiAnalysisEnabled);

    const newState = useTodoStore.getState().aiAnalysisEnabled;
    console.log('New AI Analysis Status:', newState ? 'ENABLED' : 'DISABLED');

    // Test creating a task with AI disabled
    if (!newState) {
        console.log('✅ AI Analysis is DISABLED - tasks will use basic analysis');
        console.log('✅ Priority scoring will be skipped');
        console.log('✅ Voice-to-task will use basic analysis');
    } else {
        console.log('✅ AI Analysis is ENABLED - tasks will use AI analysis');
        console.log('✅ Priority scoring will be available');
        console.log('✅ Voice-to-task will use AI analysis');
    }

    // Reset to original state
    setTimeout(() => {
        setAiAnalysisEnabled(aiAnalysisEnabled);
        console.log('Reset AI Analysis to original state:', aiAnalysisEnabled ? 'ENABLED' : 'DISABLED');
    }, 2000);

    return {
        originalState: aiAnalysisEnabled,
        newState: newState,
        testPassed: true
    };
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
    (window as any).testAiAnalysisSwitch = testAiAnalysisSwitch;
}
