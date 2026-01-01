
"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { FileText, ArrowRight, Loader2, CheckCircle, Upload, AlertCircle, Award } from "lucide-react";
import Link from "next/link";

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);

    const LOADING_STEPS = [
        "Uploading...",
        "Parsing PDF...",
        "Analyzing Content...",
        "Checking Keywords...",
        "Predicting Score...",
        "Finalizing..."
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
            }, 2000); // Change text every 2 seconds
        }
        return () => clearInterval(interval);
    }, [loading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Use environment variable or default to local open-resume instance
            // Note: In production, ensure this URL points to your deployed Render service
            const apiUrl = process.env.NEXT_PUBLIC_RESUME_PARSER_URL || "http://localhost:3000/api/parser";

            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                // Try to get error details from JSON response
                let errorDetails = "Failed to parse resume";
                try {
                    const errorJson = await response.json();
                    if (errorJson.error) errorDetails = errorJson.error;
                    if (errorJson.details) errorDetails += `: ${errorJson.details}`;
                } catch (e) {
                    // Ignore json parse error
                }
                throw new Error(errorDetails);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to connect to the parser service.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.hero}>
                    <div className={styles.iconWrapper}>
                        <FileText size={64} className={styles.icon} />
                    </div>
                    <h1 className={styles.title}>Resume Parser</h1>
                    <p className={styles.description}>
                        Upload your resume to evaluate its ATS score and match with job opportunities.
                    </p>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {!result ? (
                            <div style={{
                                marginTop: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1.5rem',
                                width: '100%',
                                maxWidth: '500px'
                            }}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    id="resume-upload"
                                />
                                <label
                                    htmlFor="resume-upload"
                                    className={styles.comingSoon} /* Reusing existing style for base */
                                    style={{
                                        cursor: 'pointer',
                                        padding: '2rem',
                                        border: '2px dashed #3f3f46',
                                        borderRadius: '12px',
                                        width: '100%',
                                        textAlign: 'center',
                                        background: 'transparent',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}
                                >
                                    <Upload size={32} className="text-gray-400" />
                                    <span style={{ fontSize: '1.1rem' }}>
                                        {file ? file.name : "Click to Upload Resume (PDF)"}
                                    </span>
                                </label>

                                {file && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className={styles.primaryButton}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className={styles.spinner} /> {LOADING_STEPS[loadingStep]}
                                            </>
                                        ) : (
                                            "Analyze Resume"
                                        )}
                                    </button>
                                )}

                                {loading && (
                                    <p style={{ fontSize: '0.9rem', color: '#e4e4e7', textAlign: 'center', marginTop: '0.5rem', opacity: 0.9 }}>
                                        Results may take 1-2 minutes. (Beta Version)
                                    </p>
                                )}
                                {error && (
                                    <div style={{
                                        color: '#ef4444',
                                        marginTop: '0.5rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        width: '100%',
                                        textAlign: 'center'
                                    }}>
                                        <AlertCircle size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                marginTop: '2rem',
                                width: '100%',
                                maxWidth: '800px',
                                display: 'grid',
                                gridTemplateColumns: 'minmax(300px, 1fr) 1fr',
                                gap: '1.5rem',
                                alignItems: 'start'
                            }}>
                                {/* Score Card */}
                                <div style={{
                                    background: '#18181b',
                                    padding: '2rem',
                                    borderRadius: '16px',
                                    border: '1px solid #27272a',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center'
                                }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#a1a1aa', marginBottom: '1rem' }}>ATS Match Score</h3>
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        border: `8px solid ${result.score?.totalScore > 70 ? '#22c55e' : result.score?.totalScore > 40 ? '#eab308' : '#ef4444'}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        marginBottom: '1rem'
                                    }}>
                                        <span style={{ fontSize: '2.5rem', lineHeight: '1' }}>{result.score?.totalScore || 0}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '4px' }}>± 5</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#71717a' }}>
                                        {result.score?.totalScore > 70 ? 'Excellent! Your resume is well-optimized.' :
                                            result.score?.totalScore > 40 ? 'Good start, but needs improvement.' : 'Needs significant updates.'}
                                    </p>
                                </div>

                                {/* Details Card */}
                                <div style={{
                                    background: '#18181b',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: '1px solid #27272a'
                                }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Award size={20} className="text-blue-400" /> Score Breakdown
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {result.score?.breakdown && Object.entries(result.score.breakdown).map(([key, value]) => (
                                            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span style={{ textTransform: 'capitalize', color: '#d4d4d8' }}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span style={{ fontWeight: 'bold', color: (value as number) > 0 ? '#4ade80' : '#71717a' }}>
                                                    +{value as number} pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {result.score?.feedback && result.score.feedback.length > 0 && (
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #27272a' }}>
                                            <h4 style={{ fontSize: '0.95rem', color: '#f87171', marginBottom: '0.5rem' }}>Improvements Needed:</h4>
                                            <ul style={{ paddingLeft: '1.2rem', color: '#a1a1aa', fontSize: '0.9rem' }}>
                                                {result.score.feedback.map((fb: string, i: number) => (
                                                    <li key={i}>{fb}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                        <Link
                                            href={`/jobs?q=${result.keywords ? encodeURIComponent(result.keywords.join(' ')) : ''}`}
                                            className={styles.primaryButton}
                                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem', padding: '0.8rem' }}
                                        >
                                            Match with Jobs
                                        </Link>
                                        <button
                                            onClick={() => { setFile(null); setResult(null); }}
                                            style={{
                                                padding: '0.8rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #3f3f46',
                                                background: 'transparent',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!result && !file && (
                        <div className={styles.actions}>
                            <Link href="/jobs" className={styles.primaryButton}>
                                Browse Jobs <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.capstone}>
                        Developed as a Capstone Project
                    </div>

                    <div className={styles.centerBlock}>
                        <div className={styles.copy}>
                            &copy; {new Date().getFullYear()} Job Cloud. All rights reserved.
                        </div>
                    </div>

                    <div className={styles.footerLinks}>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms & Conditions</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
