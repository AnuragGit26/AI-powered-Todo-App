import React, { useEffect } from 'react';
import { useMutationStore } from '../store/mutationStore';
import { useToast } from '../hooks/use-toast';

const NavigationBlocker: React.FC = () => {
    const isMutating = useMutationStore((s) => s.activeCrudCount > 0);
    const { toast } = useToast();

    useEffect(() => {
        if (!isMutating) return;

        const notify = () =>
            toast({
                title: 'Please wait',
                description:
                    'A save/update is in progress. Navigation is disabled until it completes.',
                duration: 3000,
            });

        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest ? (target.closest('a') as HTMLAnchorElement | null) : null;
            if (!anchor) return;
            if (anchor.target === '_blank') return;
            try {
                const url = new URL(anchor.href, window.location.origin);
                if (url.origin !== window.location.origin) return;
            } catch {
                void 0;
            }

            e.preventDefault();
            e.stopPropagation();
            notify();
        };

        const onPopState = () => {
            history.pushState(null, '', window.location.href);
            notify();
        };

        window.addEventListener('click', onClick, true);
        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('click', onClick, true);
            window.removeEventListener('popstate', onPopState);
        };
    }, [isMutating, toast]);

    return null;
};

export default NavigationBlocker;


