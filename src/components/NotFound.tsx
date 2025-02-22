// src/components/NotFound.tsx
import React from 'react';
import FuzzyText from './ui/FuzzyText'

const NotFound: React.FC = () => {
    return (
        <div>
            <FuzzyText
            baseIntensity={0.2}
            hoverIntensity={0.5}
            enableHover={true}
            >
  404
    </FuzzyText>
        </div>
    );
};

export default NotFound;