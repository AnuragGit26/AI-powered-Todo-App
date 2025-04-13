import React, { useState, useEffect, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Image, Upload, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useMetrics } from "../hooks/useMetrics.ts";

interface UserProfilePictureUploaderProps {
    onUploadSuccess?: () => void;
}

const UserProfilePictureUploader: React.FC<UserProfilePictureUploaderProps> = ({
    onUploadSuccess,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
    const bucketName = "MultiMedia Bucket";
    const { logUserActivity } = useMetrics();

    // Get the current user id from Supabase
    const getUserId = async (): Promise<string | null> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user?.id || null;
    };

    // On component mount, set the existing public URL for the profile image.
    useEffect(() => {
        const fetchProfileImage = async () => {
            const userId = await getUserId();
            if (userId) {
                const filePath = `${userId}/profile.jpg`;
                const { data } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);
                setPreview(data.publicUrl);
            }
        };
        fetchProfileImage();
    }, []);

    useEffect(() => {
        if (preview) {
            localStorage.setItem('profilePicture', preview);
        }
    }, [preview]);

    // When a file is selected, update state and show a temporary local preview.
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    // On upload, delete the old file if provided and upload the new file with a unique name.
    const handleUpload = async () => {
        setUploadError(null);
        setUploadSuccess(false);

        if (!file) return;

        const userId = await getUserId();
        if (!userId) {
            setUploadError("User not found.");
            return;
        }

        try {
            // Try to delete any potential existing profile images with different extensions
            const commonExtensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
            for (const ext of commonExtensions) {
                const oldFilePath = `${userId}/profile.${ext}`;
                await supabase.storage
                    .from(bucketName)
                    .remove([oldFilePath])
                    .catch(() => {
                        // Ignore errors if file doesn't exist
                    });
            }

            // Always save as jpg for consistency with App.tsx and useUserData.ts
            const newFileName = `profile.jpg`;
            const newFilePath = `${userId}/${newFileName}`;

            // Upload the new file.
            const { error } = await supabase.storage
                .from(bucketName)
                .upload(newFilePath, file, { upsert: true });
            if (error) {
                setUploadError("Error uploading image.");
                return;
            }

            // Get the new public URL.
            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(newFilePath);
            setPreview(data.publicUrl);

            // Save to localStorage for immediate use across the app
            localStorage.setItem('profilePicture', data.publicUrl);

            setUploadSuccess(true);
            logUserActivity(userId, "User updated profile picture");

            // Invoke the success callback after a short delay.
            setTimeout(() => {
                if (onUploadSuccess) onUploadSuccess();
            }, 2000);
        } catch (err) {
            console.error("Unexpected error:", err);
            setUploadError("An unexpected error occurred.");
        }
    };

    return (
        <div className="mb-6">
            <h3 className="text-xl mb-4">Update Profile Picture</h3>
            {preview && (
                <img src={preview} alt="Profile" className="w-32 h-32 rounded-full mb-4" />
            )}
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            <Button onClick={handleUpload} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white">
                Upload Picture
            </Button>
            {uploadError && <p className="text-red-500 mt-2">{uploadError}</p>}
            {uploadSuccess && <p className="text-green-500 mt-2">Upload successful!</p>}
        </div>
    );
};

export default UserProfilePictureUploader;