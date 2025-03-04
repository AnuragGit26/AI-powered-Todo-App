import React from 'react';
import { SketchPicker } from 'react-color';

interface ColorPickerProps {
    color: string;
    onColorChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onColorChange }) => {
    const handleChangeComplete = (newColor: any) => {
        onColorChange(newColor.hex);
    };

    return (
        <SketchPicker color={color} onChangeComplete={handleChangeComplete} />
    );
};