"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './admin.module.css'
import AdminNavbar from './_components/AdminNavbar'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading, isAdmin, signOut } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    // State for Gimmick (Unauthorized Access)
    const [countdown, setCountdown] = useState(30);
    const [exploded, setExploded] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/admin')
        }
    }, [user, loading, router])

    // Timer Effect - Only runs if user is logged in but NOT admin
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (user && !loading && !isAdmin) {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setExploded(true);

                        // Play explosion sound effect
                        try {
                            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                            if (AudioContext) {
                                const ctx = new AudioContext();
                                const osc = ctx.createOscillator();
                                const gain = ctx.createGain();

                                const bufferSize = ctx.sampleRate * 2;
                                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                                const data = buffer.getChannelData(0);
                                for (let i = 0; i < bufferSize; i++) {
                                    data[i] = Math.random() * 2 - 1;
                                }

                                const noise = ctx.createBufferSource();
                                noise.buffer = buffer;

                                const filter = ctx.createBiquadFilter();
                                filter.type = 'lowpass';
                                filter.frequency.value = 1000;

                                noise.connect(filter);
                                filter.connect(gain);
                                gain.connect(ctx.destination);

                                gain.gain.setValueAtTime(1, ctx.currentTime);
                                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

                                noise.start();
                                noise.stop(ctx.currentTime + 2);
                            }
                        } catch (e) {
                            console.error("Audio synth failed", e);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [user, loading, isAdmin]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        )
    }

    if (!user) {
        return null; // Redirecting...
    }

    if (!isAdmin) {
        if (exploded) {
            return (
                <div className={`${styles.loadingContainer} ${styles.shake}`}>
                    <div className={styles.blastOverlay}></div>
                    <div className={styles.explodedContainer}>
                        <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>⛔️ ☠️</div>
                        <div className={styles.explodedText}>ACCESS TERMINATED</div>
                        <p>User account has been flagged for unauthorized entry attempts.</p>
                        <p>System admin has been notified of your IP address.</p>
                        <div className="flex flex-col gap-3 mt-8">
                            <Link
                                href="/"
                                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Escape to Safety
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.loginContainer}>
                <div className={styles.loginCard} style={{ borderColor: '#ef4444', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)' }}>
                    <div className={styles.loginHeader}>
                        <div className={styles.iconWrapper} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <ShieldAlert size={24} />
                        </div>
                        <h1 className={styles.title} style={{ color: '#ef4444' }}>⚠️ UNAUTHORIZED ACCESS ⚠️</h1>
                        <p className={styles.subtitle} style={{ color: '#f87171' }}>Self-Destruct Sequence Initiated</p>
                        <div className={styles.bombTimer}>
                            00:{countdown.toString().padStart(2, '0')}
                        </div>
                    </div>

                    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} style={{ color: '#ef4444' }}>Authorization Code Alpha</label>
                            <input
                                type="text"
                                disabled
                                className={styles.input}
                                placeholder="ACCESS DENIED"
                                style={{ borderColor: '#7f1d1d', backgroundColor: '#450a0a', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} style={{ color: '#ef4444' }}>Authorization Code Beta</label>
                            <input
                                type="text"
                                disabled
                                className={styles.input}
                                placeholder="ACCESS DENIED"
                                style={{ borderColor: '#7f1d1d', backgroundColor: '#450a0a', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} style={{ color: '#ef4444' }}>Do NOT Cut This Wire</label>
                            <input
                                type="text"
                                disabled
                                className={styles.input}
                                placeholder="SYSTEM LOCKED"
                                style={{ borderColor: '#7f1d1d', backgroundColor: '#450a0a', cursor: 'not-allowed' }}
                            />
                        </div>

                        <button
                            type="button"
                            disabled
                            className={styles.redButton}
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                            ABORT DESTRUCTION (DISABLED)
                        </button>

                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm">
                                Run away (Return Home)
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Top Navigation Taskbar */}
            <AdminNavbar />

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    )
}
