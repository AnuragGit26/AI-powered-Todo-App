import { ListTodo } from "lucide-react";
import React from "react";
import logo from '/assets/logo.png'

interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = "", showText = false }) => {

    return (
        <div className={`flex items-center ${className}`}>
            <img
                src={logo}
                alt="TaskMind AI Logo"
                width={size}
                height={size}
                className="object-contain"
                style={{ aspectRatio: '1/1' }}
            />
            {showText && (
                <div className="flex flex-row m-2">
                    <span className="font-bold text-2xl text-gray-900 dark:text-white font-['Open_Sans'] p-4">
                        TaskMind AI
                    </span>
                </div>
            )}

        </div>
    );
};

export default Logo;