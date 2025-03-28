declare module '*.jsx' {
    import React from 'react';
    const component: React.ComponentType<Record<string, unknown>>;
    export default component;
} 