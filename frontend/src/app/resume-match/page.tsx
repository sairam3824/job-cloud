"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Briefcase, ExternalLink, MapPin, Clock, Star, AlertCircle, RefreshCw } from "lucide-react"; // Import necessary icons
import ResumeUpload from "@/features/resume/components/ResumeUpload";
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

    const handleKeywordsExtracted = async (extractedKeywords: string[]) => {
        setKeywords(extractedKeywords);
        setFetchingJobs(true);

        try {
            // 1. Fetch recent jobs (e.g. last 7 days) to match against
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

                {/* Section 1: Upload (Show only if no keywords yet, or allow re-upload) */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Find jobs that fit <span className="text-blue-400">your skills.</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                        Upload your resume to automatically extract skills and match them with active job listings.
                    </p>

                    {!keywords ? (
                        <ResumeUpload onUploadComplete={handleKeywordsExtracted} />
                    ) : (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-center gap-2 text-green-400 font-semibold mb-2">
                                <Star size={20} fill="currentColor" />
                                Resume Analyzed Successfully
                            </div>
                            <p className="text-sm text-gray-400 mb-4">
                                Found {keywords.length} relevant keywords from your resume.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
                                {keywords.slice(0, 15).map((k, i) => (
                                    <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-blue-200">
                                        {k}
                                    </span>
                                ))}
                                {keywords.length > 15 && (
                                    <span className="px-3 py-1 text-xs text-gray-500">+{keywords.length - 15} more</span>
                                )}
                            </div>

                            <button
                                onClick={() => { setKeywords(null); setMatchedJobs([]); }}
                                className="mt-6 text-sm text-gray-500 hover:text-white underline"
                            >
                                Upload different resume
                            </button>
                        </div>
                    )}
                </div>

                {/* Section 2: Results */}
                {keywords && (
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
                )}
            </main>
        </div>
    );
}
