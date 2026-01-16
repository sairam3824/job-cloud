"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, X as XIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "../auth.module.css";

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            router.replace(redirect);
        }
    }, [user, authLoading, router, redirect]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Password Validation State
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) {
            setError("Please ensure your password meets all requirements.");
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
                data: {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={`${styles.card} ${styles.successBox}`}>
                    <h2 className={styles.successTitle}>
                        Check your email
                    </h2>
                    <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>
                        We've sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account.
                    </p>
                    <Link
                        href="/login"
                        className={styles.button}
                        style={{ textDecoration: 'none' }}
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backLink}>
                <ArrowLeft size={20} />
                Back to Home
            </Link>

            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Create Account
                    </h1>
                    <p className={styles.subtitle}>Join to unlock all features</p>
                </div>

                <form onSubmit={handleSignup} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>First Name</label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className={styles.input}
                                placeholder="John"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className={styles.input}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="••••••••"
                        />

                        {/* Password Checklist */}
                        <div className={styles.passwordRequirements}>
                            <div className={styles.requirementTitle}>Password Requirements</div>

                            <div className={`${styles.requirementItem} ${hasMinLength ? styles.requirementMet : styles.requirementUnmet}`}>
                                {hasMinLength ? <Check size={14} /> : <div style={{ width: 14 }} />}
                                At least 8 characters
                            </div>
                            <div className={`${styles.requirementItem} ${hasNumber ? styles.requirementMet : styles.requirementUnmet}`}>
                                {hasNumber ? <Check size={14} /> : <div style={{ width: 14 }} />}
                                At least one number
                            </div>
                            <div className={`${styles.requirementItem} ${hasSpecialChar ? styles.requirementMet : styles.requirementUnmet}`}>
                                {hasSpecialChar ? <Check size={14} /> : <div style={{ width: 14 }} />}
                                At least one special character
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isPasswordValid}
                        className={styles.button}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign Up"}
                    </button>
                </form>

                <div className={styles.footer}>
                    Already have an account?{" "}
                    <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className={styles.link}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
