"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import styles from "../auth.module.css";

function LoginContent() {
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
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push(redirect);
            router.refresh();
        }
    };

    if (authLoading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    }
    return (
        <div className={styles.container}>


            <div className={styles.contentWrapper}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            Welcome Back
                        </h1>
                        <p className={styles.subtitle}>Sign in to access your account</p>
                    </div>

                    <form onSubmit={handleLogin} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.button}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        Don't have an account?{" "}
                        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className={styles.link}>
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
