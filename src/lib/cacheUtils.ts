export class AIPriorityCache {
    private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

    static get(taskId: string): any | null {
        const cached = localStorage.getItem(`ai_priority_${taskId}`);
        if (!cached) return null;

        try {
            const { data, expiresAt } = JSON.parse(cached);
            if (Date.now() > expiresAt) {
                localStorage.removeItem(`ai_priority_${taskId}`);
                return null;
            }
            return data;
        } catch {
            localStorage.removeItem(`ai_priority_${taskId}`);
            return null;
        }
    }

    static set(taskId: string, score: any): void {
        const item = {
            data: score,
            expiresAt: Date.now() + this.CACHE_DURATION
        };

        try {
            localStorage.setItem(`ai_priority_${taskId}`, JSON.stringify(item));
        } catch {
            // Storage full - clear expired and retry
            this.clearExpired();
            try {
                localStorage.setItem(`ai_priority_${taskId}`, JSON.stringify(item));
            } catch {
                console.warn('Failed to cache AI priority data');
            }
        }
    }

    static clearExpired(): void {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('ai_priority_'));
        const now = Date.now();

        keys.forEach(key => {
            try {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const { expiresAt } = JSON.parse(cached);
                    if (now > expiresAt) {
                        localStorage.removeItem(key);
                    }
                }
            } catch {
                localStorage.removeItem(key);
            }
        });
    }
} 