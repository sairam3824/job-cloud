"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Briefcase, ExternalLink, MapPin, Clock, Star, AlertCircle, RefreshCw, FileText, CheckCircle } from "lucide-react"; // Import necessary icons
import ResumeUpload, { ResumeAnalysisResult } from "@/features/resume/components/ResumeUpload";
import ReactMarkdown from 'react-markdown'; // Ensure this is installed or use simple text rendering
import Link from 'next/link';

// --- Types (Reused/Simplified) ---
type Job = {
    id: string;
    title: string;
    company: string;
    location: string;
    job_url: string;
    site: string;
    crawled_date: string;
    description: string;
    skills?: string | null; // Important for matching: can be null
    job_type: string;
    // Add other fields if needed for display
    matchScore?: number; // Calculated field
    matchReasons?: string[]; // Why it matched
};

export default function ResumeMatchPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/resume-match');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gray-400">Loading...</div>;
    }

    if (!user) return null; // Prevent flash

    const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
    const [keywords, setKeywords] = useState<string[] | null>(null);
    const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingJobs, setFetchingJobs] = useState(false);

    // --- Logic ---

    // Scoring Algorithm
    const scoreJob = (job: Job, userKeywords: string[]): { score: number, reasons: string[] } => {
        let score = 0;
        const reasons: string[] = [];

        const jobDesc = (job.description || "").toLowerCase();
        const jobSkills = (job.skills || "").toLowerCase(); // Supabase field might be a JSON string or plain text

        userKeywords.forEach(keyword => {
            const kw = keyword.toLowerCase();
            let found = false;

            // Check in explicit skills column (Higher weight)
            if (jobSkills.includes(kw)) {
                score += 2;
                found = true;
            }
            // Check in description (Lower weight)
            else if (jobDesc.includes(kw)) {
                score += 1; // Found in text
                found = true;
            }

            if (found) {
                // prevent duplicate reasons if we want concise output
                if (!reasons.includes(kw)) {
                    reasons.push(kw);
                }
            }
        });

        // Normalize or cap score if needed, or just return raw score
        return { score, reasons };
    };

    const handleUploadComplete = async (result: ResumeAnalysisResult) => {
        setAnalysis(result);
        const extractedKeywords = result.keywords;
        setKeywords(extractedKeywords);
        setFetchingJobs(true);

        try {
            // 1. Fetch recent jobs (e.g. last 14 days) to match against
            // In a real production app with many jobs, we'd do this via an Edge Function
            // or use PostgreSQL full text search. For now, client-side is fine.

            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 14); // Last 2 weeks
            const dateStr = fromDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from("jobs")
                .select("*")
                .gte("crawled_date", dateStr)
                .order("crawled_date", { ascending: false });

            if (error) throw error;

            if (!data) {
                setMatchedJobs([]);
                return;
            }

            // 2. Client-side matching
            const scoredJobs = data.map((job: any) => {
                const { score, reasons } = scoreJob(job, extractedKeywords);
                return { ...job, matchScore: score, matchReasons: reasons };
            });

            // 3. Filter and Sort
            // Only keep jobs with score > 0
            const relevantJobs = scoredJobs
                .filter(j => j.matchScore > 0)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 50); // Top 50 matches

            setMatchedJobs(relevantJobs);

        } catch (err) {
            console.error("Error matching jobs:", err);
            // Handle error UI if needed
        } finally {
            setFetchingJobs(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
            {/* Header / Nav */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
                <Link href="/jobs" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                    Back to Jobs
                </Link>
                <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Resume Match
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

                {/* Section 1: Upload or Analysis Report */}
                {!analysis ? (
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Find jobs that fit <span className="text-blue-400">your skills.</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                            Upload your resume to receive a detailed ATS analysis and automatically match with active job listings.
                        </p>
                        <ResumeUpload onUploadComplete={handleUploadComplete} />
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 1. Resume Analysis Report */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="bg-white/5 border-b border-white/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <FileText className="text-blue-400" />
                                        Resume Analysis
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Analyzed for ATS compatibility and job matching potential.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => { setAnalysis(null); setMatchedJobs([]); }}
                                        className="text-sm text-gray-400 hover:text-white underline"
                                    >
                                        Upload New
                                    </button>
                                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                                        <span className="text-3xl font-bold text-blue-400">{analysis.score.totalScore}</span>
                                        <div className="flex flex-col text-xs text-blue-200 leading-tight">
                                            <span className="font-bold">ATS SCORE</span>
                                            <span>/ 100</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Profile & Soft Skills */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-uppercase text-gray-500 tracking-wider mb-2">CANDIDATE PROFILE</h3>
                                        <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                            {analysis.resume.profile.name && (
                                                <div className="flex items-center gap-2 text-white font-medium">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400">
                                                        {analysis.resume.profile.name[0]}
                                                    </div>
                                                    {analysis.resume.profile.name}
                                                </div>
                                            )}
                                            {analysis.resume.profile.location && (
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <MapPin size={14} className="text-gray-500" />
                                                    {analysis.resume.profile.location}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-400 text-sm truncate">
                                                <div className="w-4 h-4 rounded-full bg-gray-700" /> {/* Placeholder for email icon if needed */}
                                                {user?.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-uppercase text-gray-500 tracking-wider mb-2">SOFT SKILLS</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.softSkills && analysis.softSkills.length > 0 ? (
                                                analysis.softSkills.map((skill, i) => (
                                                    <span key={i} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs rounded-md">
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-600 text-sm italic">No specific soft skills detected</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Score Breakdown */}
                                <div className="md:col-span-2 space-y-6">
                                    <div>
                                        <h3 className="text-sm font-uppercase text-gray-500 tracking-wider mb-3">PERFORMANCE BREAKDOWN</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {[
                                                { label: "Impact", val: analysis.score.breakdown.impact, icon: <Star size={14} /> },
                                                { label: "Keywords", val: analysis.score.breakdown.keywords, icon: <CheckCircle size={14} /> },
                                                { label: "Structure", val: analysis.score.breakdown.structure, icon: <FileText size={14} /> },
                                                { label: "Content", val: analysis.score.breakdown.experience, icon: <Briefcase size={14} /> },
                                            ].map((met, i) => (
                                                <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                                        {met.icon} {met.label}
                                                    </div>
                                                    <div className="text-lg font-bold text-white">
                                                        {met.val}<span className="text-gray-600 text-xs font-normal">/20</span>
                                                    </div>
                                                    <div className="w-full bg-gray-800 h-1 rounded-full mt-2">
                                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(met.val / 20) * 100}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-uppercase text-gray-500 tracking-wider mb-2">IMPROVEMENT FEEDBACK</h3>
                                        <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-4">
                                            {analysis.score.feedback && analysis.score.feedback.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {analysis.score.feedback.map((tip, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-orange-200/80">
                                                            <AlertCircle size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
                                                            {tip}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-green-400 text-sm flex items-center gap-2">
                                                    <CheckCircle size={14} /> Great job! No critical improvements detected.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-uppercase text-gray-500 tracking-wider mb-2">HARD SKILLS (USED FOR JOB MATCHING)</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.keywords.slice(0, 15).map((k, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-full">
                                                    {k}
                                                </span>
                                            ))}
                                            {analysis.keywords.length > 15 && (
                                                <span className="px-2 py-1 text-gray-500 text-xs">+{analysis.keywords.length - 15} more</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Matched Jobs Section */}
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    Matched Jobs
                                    <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                        {fetchingJobs ? "..." : matchedJobs.length}
                                    </span>
                                </h2>
                            </div>

                            {fetchingJobs ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-64 bg-gray-800/50 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : matchedJobs.length === 0 ? (
                                <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                                    <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300">No strong matches found</h3>
                                    <p className="text-gray-500 mt-2">Try adjusting your resume keywords or check back later for new jobs.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {matchedJobs.map(job => (
                                        <div
                                            key={job.id}
                                            className="group relative bg-[#111] hover:bg-[#161616] border border-white/5 hover:border-blue-500/30 rounded-xl p-5 transition-all duration-300 flex flex-col md:flex-row gap-6"
                                        >
                                            {/* Match Score Badge (Mobile: Top Right, Desktop: Left Column) */}
                                            <div className="md:w-24 flex-shrink-0 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4 gap-1">
                                                <span className="text-xs font-uppercase text-gray-500 font-semibold tracking-wider">FIT</span>
                                                <div className="text-2xl font-bold text-blue-400">
                                                    {/* Very basic score normalization logic for display */}
                                                    {Math.min(100, Math.round((job.matchScore || 0) * 5))}%
                                                </div>
                                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className="bg-blue-500 h-full rounded-full"
                                                        style={{ width: `${Math.min(100, Math.round((job.matchScore || 0) * 5))}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Job Info */}
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                            {job.title}
                                                        </h3>
                                                        <p className="text-gray-400 font-medium mb-2">{job.company}</p>
                                                    </div>
                                                    <div className="hidden sm:block text-xs text-gray-500 whitespace-nowrap">
                                                        {job.crawled_date}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                                        <MapPin size={12} /> {job.location}
                                                    </span>
                                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                                        <Briefcase size={12} /> {job.job_type || 'Full-time'}
                                                    </span>
                                                    {job.site && (
                                                        <span className="bg-white/5 px-2 py-1 rounded">
                                                            via {job.site}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Snippet of description or reasons */}
                                                <div className="text-sm text-gray-500 line-clamp-2 mb-3">
                                                    <ReactMarkdown components={{ p: 'span' }}>
                                                        {job.description?.slice(0, 150) + "..."}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="flex items-center justify-end md:justify-center">
                                                <a
                                                    href={job.job_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                                >
                                                    Apply
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
