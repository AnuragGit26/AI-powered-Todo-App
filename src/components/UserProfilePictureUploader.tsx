import React, { useState, useEffect, ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {useMetrics} from "../hooks/useMetrics.ts";


const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserProfilePictureUploaderProps {
    onUploadSuccess?: () => void;
    oldFilePath?: string;
}

const UserProfilePictureUploader: React.FC<UserProfilePictureUploaderProps> = ({
                                                                                   onUploadSuccess,
                                                                                   oldFilePath,
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
            const newFilePath = `${userId}/profile.jpg`;
            if (userId) {
                const { data } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(newFilePath);
                setPreview(data.publicUrl);
            }
        };
        fetchProfileImage();
    }, []);
    useEffect(() => {
        localStorage.setItem('profilePicture',preview);
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
            // Delete the old file if oldFilePath exists.
            const oldFileName = `profile.jpg`;
            const oldFilePath = `${userId}/${oldFileName}`
            if (oldFilePath) {
                const { error: deleteError } = await supabase.storage
                    .from(bucketName)
                    .remove([oldFilePath]);
                if (deleteError) {
                    console.error("Error deleting old file:", deleteError);
                    // Continue to upload even if deletion fails.
                }
            }

            // Generate a unique filename.
            const fileExt = file.name.split(".").pop();
            const newFileName = `profile.${fileExt}`;
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