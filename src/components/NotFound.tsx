// src/components/NotFound.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FuzzyText from './ui/FuzzyText';
import { Button } from './ui/button';
import { HomeIcon } from 'lucide-react';
import Aurora from './ui/AuroraBG';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-900 text-center px-4">
            <Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={0.5}
                amplitude={1.0}
                speed={0.7}
            />
            <div className="z-10 flex flex-col items-center gap-6 max-w-md">
                <div className="text-9xl font-bold">
                    <FuzzyText
                        baseIntensity={0.2}
                        hoverIntensity={0.5}
                        enableHover={true}
                        className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        404
                    </FuzzyText>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Page Not Found</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Button
                    onClick={handleGoHome}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg"
                >
                    <HomeIcon size={18} />
                    Go Back Home
                </Button>
            </div>
        </div>
    );
};

export default NotFound;