
"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { FileText, ArrowRight, Loader2, CheckCircle, Upload, AlertCircle, Award, Building, Briefcase, Construction } from "lucide-react";
import Modal from "@/components/Modal";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const LOADING_STEPS = [
        "Uploading Resume...",
        "Parsing PDF...",
        "Extracting Text...",
        "Cleaning & Normalizing Data...",
        "Identifying Sections...",
        "Extracting Skills...",
        "Detecting Experience & Projects...",
        "Generating Resume Embeddings...",
        "Matching Skills with Job Roles...",
        "Analyzing ATS Keywords...",
        "Checking Resume Strength...",
        "Predicting Role Fit Score...",
        "Finding Strong-Match Jobs...",
        "Analyzing Career Trends...",
        "Building Skill Gap Report...",
        "Finalizing AI Insights..."
    ];


    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep((prev) => {
                    // Once we reach the end, cycle back to "Analyzing Content..." (index 2)
                    // This prevents "Uploading..." (0) and "Parsing PDF..." (1) from showing again
                    if (prev === LOADING_STEPS.length - 1) {
                        return 2;
                    }
                    return prev + 1;
                });
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const router = useRouter();

    const handleMatchJobs = () => {
        setIsModalOpen(true);
    };

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
                    {/* Left Column: Browse Jobs */}
                    <div className={styles.leftColumn}>
                        <Link href="/jobs" className={styles.sideCard}>
                            <Briefcase size={48} className={styles.cardIcon} />
                            <h2>Browse Jobs</h2>
                            <p>Discover thousands of job opportunities tailored to your skills and preferences.</p>
                            <span className={styles.primaryButton}>
                                Explore Jobs <ArrowRight size={18} />
                            </span>
                        </Link>
                    </div>

                    {/* Center Column: Resume Parser */}
                    <div className={styles.centerColumn}>
                        <div className={styles.centerHeader}>
                            <div className={styles.iconWrapper}>
                                <FileText size={40} color="var(--primary)" />
                            </div>
                            <h1 className={styles.centerTitle}>Resume Parser</h1>
                            <p className={styles.centerDescription}>
                                Upload your resume to evaluate its ATS score and match with job opportunities.
                            </p>
                        </div>

                        {!result ? (
                            <div className={styles.uploadArea}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className={styles.uploadInput}
                                    id="resume-upload"
                                />
                                <label
                                    htmlFor="resume-upload"
                                    className={styles.uploadLabel}
                                >
                                    <Upload size={40} className="text-gray-400" />
                                    <span className={styles.uploadText}>
                                        {file ? file.name : "Click to Upload Resume (PDF)"}
                                    </span>
                                </label>

                                {file && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className={`${styles.primaryButton} ${styles.analyzeButton}`}
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
                                    <p className={styles.loadingText}>
                                        Processing your resume… Results may take up to 2 minutes. (Beta Version)
                                    </p>
                                )}
                                {error && (
                                    <div className={styles.errorBox}>
                                        <AlertCircle size={16} className={styles.errorIcon} />
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.resultsContainer}>
                                {/* Score Card */}
                                <div className={styles.scoreCard}>
                                    <h3 className={styles.scoreCardTitle}>ATS Match Score</h3>
                                    <div
                                        className={styles.scoreCircle}
                                        style={{
                                            border: `8px solid ${result.score?.totalScore > 70 ? '#22c55e' : result.score?.totalScore > 40 ? '#eab308' : '#ef4444'}`,
                                        }}>
                                        <span className={styles.scoreValue}>{result.score?.totalScore || 0}</span>
                                        <span className={styles.scoreDeviation}>± 5</span>
                                    </div>
                                    <p className={styles.scoreMessage}>
                                        {result.score?.totalScore > 70 ? 'Excellent! Your resume is well-optimized.' :
                                            result.score?.totalScore > 40 ? 'Good start, but needs improvement.' : 'Needs significant updates.'}
                                    </p>
                                </div>

                                {/* Details Card */}
                                <div className={styles.detailsCard}>
                                    <h3 className={styles.detailsHeader}>
                                        <Award size={20} className="text-blue-400" /> Score Breakdown
                                    </h3>

                                    <div className={styles.breakdownList}>
                                        {result.score?.breakdown && Object.entries(result.score.breakdown).map(([key, value]) => (
                                            <div key={key} className={styles.breakdownItem}>
                                                <span className={styles.breakdownLabel}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span className={`${styles.breakdownValue} ${(value as number) > 0 ? styles.breakdownValuePositive : ''}`}>
                                                    +{value as number} pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {result.score?.feedback && result.score.feedback.length > 0 && (
                                        <div className={styles.feedbackSection}>
                                            <h4 className={styles.feedbackHeader}>Improvements Needed:</h4>
                                            <ul className={styles.feedbackList}>
                                                {result.score.feedback.map((fb: string, i: number) => (
                                                    <li key={i}>{fb}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className={styles.resultActions}>
                                        <button
                                            onClick={handleMatchJobs}
                                            className={`${styles.primaryButton} ${styles.matchButton}`}
                                        >
                                            Match with Jobs
                                        </button>
                                        <button
                                            onClick={() => { setFile(null); setResult(null); }}
                                            className={styles.resetButton}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Browse Companies */}
                    <div className={styles.rightColumn}>
                        <Link href="/companies" className={styles.sideCard}>
                            <Building size={48} className={styles.cardIcon} />
                            <h2>Top Compaines</h2>
                            <p>Explore top leading companies and their active job listings in one place.</p>
                            <span className={`${styles.primaryButton} ${styles.secondaryButton}`}>
                                See Companies <ArrowRight size={18} />
                            </span>
                        </Link>
                    </div>
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
                        <Link href="/privacy-policy">Privacy Policy</Link>
                        <Link href="/terms-conditions">Terms & Conditions</Link>
                    </div>
                </div>
            </footer>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className={styles.modalContent}>
                    <div className={styles.modalIconWrapper}>
                        <Construction size={32} />
                    </div>
                    <h2 className={styles.modalTitle}>
                        Feature Coming Soon
                    </h2>
                    <p className={styles.modalText}>
                        The AI Job Matching feature is currently under construction. In the meantime, you can browse all available jobs manually.
                    </p>
                    <div className={styles.modalActions}>
                        <button
                            onClick={() => router.push('/jobs')}
                            className={`${styles.primaryButton} ${styles.modalBrowseButton}`}
                        >
                            Browse Jobs
                        </button>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className={styles.modalCloseButton}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
