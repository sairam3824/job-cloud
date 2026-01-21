
"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import { FileText, ArrowRight, Loader2, CheckCircle, Upload, AlertCircle, Award, Building, Briefcase, Construction, Info } from "lucide-react";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface ResumeScore {
    id: string;
    resume_name: string;
    total_score: number;
    created_at: string;
}

export default function Home() {
    const { user, loading: authLoading } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Resume Limit & History
    const [canUpload, setCanUpload] = useState(true);
    const [checkingEligibility, setCheckingEligibility] = useState(true);
    const [scoreHistory, setScoreHistory] = useState<ResumeScore[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [usageCount, setUsageCount] = useState<number>(0);

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

    const checkEligibility = useCallback(async () => {
        if (!user) return;
        try {
            // Get profile with last upload timestamp
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, last_resume_upload_at')
                .eq('id', user.id)
                .single();

            const role = profile?.role || 'user';
            setUserRole(role);

            // Check if last upload was today
            const lastUpload = profile?.last_resume_upload_at;

            if (!lastUpload) {
                // Never uploaded before - allow
                setCanUpload(true);
                setError(null);
            } else {
                // Check if last upload was today
                const lastUploadDate = new Date(lastUpload).toDateString();
                const today = new Date().toDateString();

                if (lastUploadDate === today) {
                    // Already uploaded today - block
                    setCanUpload(false);
                    setError(`Daily limit reached. Come back tomorrow!`);
                } else {
                    // Last upload was on a different day - allow
                    setCanUpload(true);
                    setError(null);
                }
            }
        } catch (err) {
            console.error("Error checking upload eligibility:", err);
        } finally {
            setCheckingEligibility(false);
        }
    }, [user]);

    const fetchScoreHistory = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('resume_scores')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (data) {
                setScoreHistory(data);
            }
        } catch (err) {
            console.error("Error fetching resume history:", err);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;

        if (user) {
            checkEligibility();
            fetchScoreHistory();
        } else {
            setCheckingEligibility(false);
        }
    }, [user, authLoading, checkEligibility, fetchScoreHistory]);

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
        if (!canUpload) {
            setError("You have reached your daily resume upload limit.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        if (user) {
            formData.append("user_id", user.id);
        }

        try {
            // Use environment variable or default to local open-resume instance
            let apiUrl = process.env.NEXT_PUBLIC_RESUME_PARSER_URL || "http://localhost:8000";
            // Normalization
            apiUrl = apiUrl.replace(/\/$/, '').replace(/\/api\/parser$/, '');

            // Call the synchronous resume parser API
            const response = await fetch(`${apiUrl}/api/parser`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                let errorDetails = "Failed to parse resume";
                try {
                    const errorJson = await response.json();
                    if (errorJson.error) errorDetails = errorJson.error;
                    if (errorJson.detail) errorDetails = errorJson.detail;
                } catch (e) { }
                throw new Error(errorDetails);
            }

            const resultData = await response.json();
            setResult(resultData);

            // Save score to database if user is logged in
            if (user && resultData.score?.totalScore) {
                try {
                    // Insert into resume_scores with correct schema
                    await supabase.from('resume_scores').insert({
                        user_id: user.id,
                        resume_name: file.name,
                        total_score: resultData.score.totalScore,
                        score_details: resultData, // Store full result as JSONB
                    });

                    // Update last_resume_upload_at in profiles
                    await supabase
                        .from('profiles')
                        .update({ last_resume_upload_at: new Date().toISOString() })
                        .eq('id', user.id);

                    // Refresh history to show the new scan in the "Performance" card
                    setTimeout(fetchScoreHistory, 500);
                    // Re-check eligibility after successful upload
                    checkEligibility();
                } catch (dbErr) {
                    console.error("Failed to save score to database:", dbErr);
                }
            }

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
                <div className={styles.headerSection}>
                    <h1 className={styles.mainTitle}>Shape Your Career with AI</h1>
                    <p className={styles.mainSubtitle}>
                        Optimize your resume, find the perfect job, and track your progress all in one place.
                    </p>
                </div>

                <div className={styles.gridContainer}>
                    {/* Card 1: Browse Jobs */}
                    <Link href="/jobs" className={`${styles.gridCard} ${styles.jobsCard}`}>
                        <div className={styles.cardHeader}>
                            <Briefcase size={32} />
                            <h3>Find Jobs</h3>
                        </div>
                        <p className={styles.cardDescription}>
                            Access thousands of active listings tailored to your profile.
                        </p>
                        <div className={styles.cardAction}>
                            <span>Browse Jobs</span> <ArrowRight size={16} />
                        </div>
                    </Link>

                    {/* Card 2: Browse Companies */}
                    <Link href="/companies" className={`${styles.gridCard} ${styles.companiesCard}`}>
                        <div className={styles.cardHeader}>
                            <Building size={32} />
                            <h3>Top Companies</h3>
                        </div>
                        <p className={styles.cardDescription}>
                            Explore leading tech companies and their culture.
                        </p>
                        <div className={styles.cardAction}>
                            <span>View Companies</span> <ArrowRight size={16} />
                        </div>
                    </Link>

                    {/* Card 3: Resume Parser */}
                    <div className={`${styles.gridCard} ${styles.parserCard}`}>
                        <div className={styles.cardHeader}>
                            <FileText size={32} className={styles.parserIcon} />
                            <h3>AI Scanner</h3>
                        </div>

                        <div className={styles.parserContent}>
                            {authLoading ? (
                                <div className={styles.loadingState}>
                                    <Loader2 className={styles.spinner} size={24} />
                                </div>
                            ) : !user ? (
                                <div className={styles.loginPrompt}>
                                    <p>Login to analyze your resume.</p>
                                    <Link href="/login" className={styles.smallButton}>Sign In</Link>
                                </div>
                            ) : loading ? (
                                <div className={styles.processingState}>
                                    <Loader2 className={styles.spinner} size={32} />
                                    <p>{LOADING_STEPS[loadingStep]}</p>
                                </div>
                            ) : result ? (
                                <div className={styles.resultSummary}>
                                    <div className={styles.miniScoreRing} style={{ borderColor: result.score?.totalScore > 70 ? '#22c55e' : result.score?.totalScore > 40 ? '#eab308' : '#ef4444' }}>
                                        <span className={styles.miniScoreValue}>{result.score?.totalScore}</span>
                                    </div>
                                    <p className={styles.scoreLabel}>ATS Score</p>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className={styles.viewDetailsButton}
                                    >
                                        View Full Report
                                    </button>
                                    <button
                                        onClick={() => { setFile(null); setResult(null); }}
                                        className={styles.newScanButton}
                                    >
                                        New Scan
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.uploadState}>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        id="resume-upload-card"
                                        className={styles.hiddenInput}
                                    />
                                    <label htmlFor="resume-upload-card" className={styles.uploadZone}>
                                        <Upload size={24} />
                                        <span>{file ? file.name : "Upload PDF"}</span>
                                    </label>
                                    {file && (
                                        <button onClick={handleUpload} className={styles.runScanButton}>
                                            Analyze
                                        </button>
                                    )}
                                    {error && <p className={styles.errorText}>{error}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 4: Dashboard */}
                    <div className={`${styles.gridCard} ${styles.dashboardCard}`}>
                        <div className={styles.cardHeader}>
                            <Award size={32} />
                            <div className={styles.headerTitleRow}>
                                <h3>Performance</h3>
                                <div className={styles.infoIconWrapper}>
                                    <Info size={16} />
                                    <div className={styles.tooltip}>
                                        <div className={styles.tooltipRow}><span className={styles.legendRed}></span> &lt; 40</div>
                                        <div className={styles.tooltipRow}><span className={styles.legendYellow}></span> 40 - 79</div>
                                        <div className={styles.tooltipRow}><span className={styles.legendGreen}></span> &gt; 80</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.dashboardContent}>
                            {!user ? (
                                <div className={styles.loginPrompt}>
                                    <p>Track your progress over time.</p>
                                    <Link href="/login" className={styles.smallButton}>Login</Link>
                                </div>
                            ) : scoreHistory.length > 0 ? (
                                <div className={styles.historyList}>
                                    <div className={styles.historyRow}>
                                        {scoreHistory.slice(0, 3).map(score => (
                                            <div key={score.id} className={styles.historyDot} title={new Date(score.created_at).toLocaleDateString()}>
                                                <div
                                                    className={styles.scoreRing}
                                                    style={{
                                                        borderColor: score.total_score >= 80 ? '#22c55e' : score.total_score >= 40 ? '#eab308' : '#ef4444',
                                                        color: score.total_score >= 80 ? '#22c55e' : score.total_score >= 40 ? '#eab308' : '#ef4444'
                                                    }}
                                                >
                                                    {score.total_score}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyDashboard}>
                                    <p>No scans yet.</p>
                                    <p className={styles.subText}>Your history will appear here.</p>
                                </div>
                            )}
                        </div>

                        {user && scoreHistory.length > 0 && (
                            <Link href="/resume-dashboard" className={styles.cardAction}>
                                <span>Go to Dashboard</span> <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>
                </div>
            </main >

            <Footer />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {result ? (
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Analysis Report</h2>
                            <p className="text-gray-400 text-sm">Detailed breakdown of your resume score.</p>
                        </div>

                        <div className={styles.modalScrollable}>
                            {/* Score Breakdown */}
                            <div className={styles.scoreCard}>
                                <div className={styles.scoreCircle} style={{ border: `8px solid ${result.score?.totalScore > 70 ? '#22c55e' : '#ef4444'}` }}>
                                    <span className={styles.scoreValue}>{result.score?.totalScore}</span>
                                </div>
                            </div>

                            {/* Predicted Roles */}
                            {result.predictedRoles && result.predictedRoles.length > 0 && (
                                <div className="mb-6 w-full">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Best Suited For</h3>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {result.predictedRoles.map((role: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.breakdownList}>
                                {result.score?.breakdown && Object.entries(result.score.breakdown).map(([key, value]) => (
                                    <div key={key} className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className={styles.breakdownValue}>+{value as number}</span>
                                    </div>
                                ))}
                            </div>

                            {result.score?.feedback && result.score.feedback.length > 0 && (
                                <div className={styles.feedbackSection}>
                                    <h4 className={styles.feedbackHeader}>Improvements:</h4>
                                    <ul className={styles.feedbackList}>
                                        {result.score.feedback.map((fb: string, i: number) => (
                                            <li key={i}>{fb}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={() => router.push('/resume-dashboard')} className={styles.primaryButton}>
                                Go to Dashboard
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className={styles.dashboardButton}>
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.modalContent}>
                        <div className={styles.modalIconWrapper}>
                            <Construction size={32} />
                        </div>
                        <h2 className={styles.modalTitle}>
                            Feature Coming Soon
                        </h2>
                        <p className={styles.modalText}>
                            The AI Job Matching feature is currently under construction.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseButton}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <div
                className={styles.hiddenTrigger}
                onClick={() => router.push('/admin/feedback')}
            />
        </div >
    );
}
