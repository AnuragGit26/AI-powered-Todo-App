import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Validates if a string is a valid UUID
 * @param uuid String to validate
 * @returns True if the string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Generates a valid UUID using the crypto API
 * @returns A new UUID string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Safely handles or repairs an invalid UUID
 * @param id The UUID to check and handle
 * @returns A valid UUID (either the original if valid, or a new one if not)
 */
export function handleUUID(id: string | undefined): string {
  if (!id || !isValidUUID(id)) {
    return generateUUID();
  }
  return id;
}
