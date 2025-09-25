import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from './ui/card';
import { Loader2, LockKeyhole, Mail, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const MIN_LEN = 8;

const ResetPasswordForm: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasRecoveryContext, setHasRecoveryContext] = useState<boolean>(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [linkSent, setLinkSent] = useState(false);
    const [authError, setAuthError] = useState<{ code?: string; description?: string; raw?: string } | null>(null);
    // Update email along with password
    const [updateEmail, setUpdateEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newEmailError, setNewEmailError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    // Password strength checks
    const pwdChecks = useMemo(() => ({
        len: password.length >= MIN_LEN,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    }), [password]);
    const pwdScore = useMemo(() => Object.values(pwdChecks).filter(Boolean).length, [pwdChecks]);
    const pwdBarClass = useMemo(() => {
        if (pwdScore <= 2) return 'bg-red-500';
        if (pwdScore === 3) return 'bg-yellow-500';
        return 'bg-green-500';
    }, [pwdScore]);
    const passwordsMatch = useMemo(() => confirm.length > 0 && confirm === password, [confirm, password]);
    const allChecksOk = useMemo(() => Object.values(pwdChecks).every(Boolean), [pwdChecks]);
    const { toast } = useToast();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const passwordRef = useRef<HTMLInputElement>(null);

    const type = useMemo(() => params.get('type'), [params]);
    const isRecoveryHash = useMemo(() => {
        try {
            const h = window.location.hash || '';
            if (!h) return false;
            const hp = new URLSearchParams(h.startsWith('#') ? h.slice(1) : h);
            return hp.get('type') === 'recovery';
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const url = window.location.href;
                const hash = window.location.hash || '';
                const search = window.location.search || '';
                console.log('[ResetPassword] init start', {
                    hashPresent: Boolean(hash),
                    searchPresent: Boolean(search),
                    isRecoveryHash,
                    typeParam: type,
                });

                // Parse hash/search for error information (e.g., otp_expired)
                let localAuthErr: { code?: string; description?: string; raw?: string } | null = null;
                try {
                    const hpAll = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
                    const spAll = new URLSearchParams(search);
                    const err = hpAll.get('error') || spAll.get('error');
                    const errCode = hpAll.get('error_code') || spAll.get('error_code');
                    const errDesc = hpAll.get('error_description') || spAll.get('error_description');
                    if (err || errCode || errDesc) {
                        localAuthErr = { code: errCode || err || undefined, description: errDesc || undefined, raw: hash || search };
                        setAuthError(localAuthErr);
                        console.warn('[ResetPassword] auth error from URL', localAuthErr);
                    }
                    const emailParam = hpAll.get('email') || spAll.get('email');
                    if (emailParam) {
                        setEmail(emailParam);
                        setNewEmail(emailParam);
                    }
                } catch (parseErr) {
                    console.warn('[ResetPassword] failed to parse error/email params:', parseErr);
                }
                if (hash.includes('access_token') && hash.includes('refresh_token')) {
                    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
                    const access_token = hashParams.get('access_token') || undefined;
                    const refresh_token = hashParams.get('refresh_token') || undefined;
                    if (access_token && refresh_token) {
                        setHasRecoveryContext(true);
                        supabase.auth.setSession({ access_token, refresh_token })
                            .then(() => {
                                console.log('[ResetPassword] setSession completed');
                            })
                            .catch((err) => {
                                console.warn('[ResetPassword] setSession error (non-blocking):', err);
                            });
                    }
                }

                const hasCode = /[?&]code=/.test(url);
                if (hasCode && typeof supabase.auth.exchangeCodeForSession === 'function') {
                    setHasRecoveryContext(true);
                    try {
                        await supabase.auth.exchangeCodeForSession(url);
                        console.log('[ResetPassword] exchangeCodeForSession success');
                    } catch (err) {
                        console.warn('[ResetPassword] exchangeCodeForSession error (non-blocking):', err);
                    }
                }
            } catch (e) {
                console.error('[ResetPassword] Recovery link handling failed or not required:', e);
            }

            // Finalize UI intent: if URL indicated recovery, ensure the form is shown
            const isRecovery = (type === 'recovery' || isRecoveryHash) && !authError;
            setHasRecoveryContext(prev => prev || isRecovery);

            try {
                const currentUrl = new URL(window.location.href);
                if (currentUrl.hash) {
                    currentUrl.hash = '';
                }
                if (currentUrl.searchParams.has('code')) currentUrl.searchParams.delete('code');
                if (currentUrl.searchParams.has('type')) currentUrl.searchParams.delete('type');
                if (currentUrl.searchParams.has('redirect_to')) currentUrl.searchParams.delete('redirect_to');
                window.history.replaceState({}, document.title, currentUrl.toString());
                console.log('[ResetPassword] cleaned URL (hash/query params removed)');
            } catch (err) {
                console.warn('[ResetPassword] Could not clean URL:', err);
            }
        };
        init();
    }, [type, isRecoveryHash, authError]);

    useEffect(() => {
        if (hasRecoveryContext) {
            setTimeout(() => passwordRef.current?.focus(), 0);
        }
    }, [hasRecoveryContext]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[ResetPassword] submit new password');
        if (password.length < MIN_LEN) {
            toast({
                title: 'Weak password',
                description: `Password must be at least ${MIN_LEN} characters long`,
                variant: 'destructive',
            });
            return;
        }
        if (!allChecksOk) {
            toast({
                title: 'Improve password strength',
                description: 'Use upper, lower, number, and a symbol.',
                variant: 'destructive',
            });
            return;
        }
        if (!passwordsMatch) {
            toast({
                title: 'Passwords do not match',
                description: 'Please retype your new password.',
                variant: 'destructive',
            });
            return;
        }
        if (updateEmail && !validateNewEmail(newEmail)) {
            toast({ title: 'Invalid email', description: 'Please provide a valid new email address', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            // Build update payload. Requires an active session (via recovery link)
            const payload: { password: string; email?: string } = { password };
            if (updateEmail) payload.email = newEmail.trim();

            const { error } = await supabase.auth.updateUser(payload);
            if (error) {
                console.error('[ResetPassword] updateUser error', error);
                toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
                return;
            }
            console.log('[ResetPassword] password updated, redirecting to /login');
            toast({
                title: updateEmail ? 'Password and email updated' : 'Password updated',
                description: updateEmail
                    ? 'If email change requires confirmation, check your inbox.'
                    : 'You can now sign in with your new password.',
            });
            navigate('/login', { replace: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error('[ResetPassword] unexpected error during submit', err);
            toast({ title: 'Unexpected error', description: message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const validateEmail = (value: string) => {
        if (!value.trim()) {
            setEmailError('Email is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validateNewEmail = (value: string) => {
        if (!value.trim()) {
            setNewEmailError('Email is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setNewEmailError('Please enter a valid email address');
            return false;
        }
        setNewEmailError('');
        return true;
    };

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (linkSent) {
            return;
        }
        if (!validateEmail(email)) {
            toast({ title: 'Validation Error', description: 'Please provide a valid email address', variant: 'destructive' });
            return;
        }
        setRequesting(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Reset link sent', description: 'Check your inbox for the password reset link.' });
                setLinkSent(true);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast({ title: 'Unexpected error', description: message, variant: 'destructive' });
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
            <Card className="w-full max-w-md border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-900/30 overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
                <CardHeader className="space-y-1 pb-6 pt-8 px-6 text-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 flex items-center justify-center">
                        <LockKeyhole className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {hasRecoveryContext ? 'Set a new password' : 'Reset your password'}
                    </h2>
                    <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                        {hasRecoveryContext
                            ? 'Enter your new password below.'
                            : 'Enter your email to receive a password reset link.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {authError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Password reset link error</AlertTitle>
                            <AlertDescription>
                                {authError.description || 'The reset link is invalid or has expired. Please request a new link below.'}
                            </AlertDescription>
                        </Alert>
                    )}
                    {hasRecoveryContext ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={MIN_LEN}
                                        required
                                        ref={passwordRef}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                    <div
                                        className={`h-2 ${pwdBarClass}`}
                                        style={{ width: `${(pwdScore / 5) * 100}%` }}
                                    />
                                </div>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-1">
                                    <li className={pwdChecks.len ? 'text-green-600 dark:text-green-400' : ''}>≥ {MIN_LEN} characters</li>
                                    <li className={pwdChecks.lower ? 'text-green-600 dark:text-green-400' : ''}>Lowercase letter</li>
                                    <li className={pwdChecks.upper ? 'text-green-600 dark:text-green-400' : ''}>Uppercase letter</li>
                                    <li className={pwdChecks.number ? 'text-green-600 dark:text-green-400' : ''}>Number</li>
                                    <li className={pwdChecks.symbol ? 'text-green-600 dark:text-green-400' : ''}>Symbol</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm" className="text-gray-700 dark:text-gray-200">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Retype new password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        minLength={MIN_LEN}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        onClick={() => setShowConfirm((v) => !v)}
                                    >
                                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {confirm.length > 0 && !passwordsMatch && (
                                    <p className="text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="updateEmail" className="flex items-center gap-2">
                                    <input
                                        id="updateEmail"
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={updateEmail}
                                        onChange={(e) => setUpdateEmail(e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-200">Also update my email</span>
                                </label>
                                {updateEmail && (
                                    <div className="space-y-1">
                                        <Label htmlFor="newEmail" className="text-gray-700 dark:text-gray-200">New Email</Label>
                                        <Input
                                            id="newEmail"
                                            type="email"
                                            placeholder="new@example.com"
                                            value={newEmail}
                                            onChange={(e) => {
                                                setNewEmail(e.target.value);
                                                if (newEmailError) validateNewEmail(e.target.value);
                                            }}
                                            className={newEmailError ? 'border-red-500 focus:ring-red-500' : ''}
                                        />
                                        {newEmailError && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{newEmailError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full py-2.5"
                                disabled={
                                    submitting ||
                                    !allChecksOk ||
                                    !passwordsMatch ||
                                    (updateEmail && (!newEmail || !!newEmailError))
                                }
                            >
                                {submitting ? (
                                    <span className="inline-flex items-center"><Loader2 className="h-5 w-5 mr-2 animate-spin" />Updating...</span>
                                ) : (
                                    'Update Password'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleRequestSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">Email Address</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) validateEmail(e.target.value);
                                            // Allow re-sending if the user edits the email
                                            if (linkSent) setLinkSent(false);
                                        }}
                                        className={`pl-10 ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        required
                                    />
                                </div>
                                {emailError && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{emailError}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full py-2.5" disabled={requesting || linkSent}>
                                {requesting ? (
                                    <span className="inline-flex items-center"><Loader2 className="h-5 w-5 mr-2 animate-spin" />Sending...</span>
                                ) : linkSent ? (
                                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5 mr-2" />Sent</span>
                                ) : (
                                    'Send Password Reset Link'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-center w-full text-gray-500 dark:text-gray-400">
                        <a href="/login" className="underline text-indigo-600 dark:text-indigo-400">Back to login</a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ResetPasswordForm;
