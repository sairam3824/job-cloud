"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Bookmark,
    ArrowLeft,
    ExternalLink,
    Trash2,
    MapPin,
    Clock,
    Building
} from "lucide-react";
import styles from "./saved.module.css";
import Navbar from "@/components/Navbar"; // Assuming globally available or we can just skip for now as Layout has it

type Job = {
    id: string;
    title: string;
    company: string;
    location: string;
    job_url: string;
    crawled_date: string;
    job_type?: string;
    site?: string;
};

// Joined type
type SavedJobItem = {
    id: string; // ID of the saved_jobs entry
    created_at: string;
    job: Job;
};

export default function SavedJobsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/saved-jobs');
        }
    }, [authLoading, user, router]);

    const fetchSavedJobs = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('saved_jobs')
            .select(`
                id,
                created_at,
                job:jobs (
                    id,
                    title,
                    company,
                    location,
                    job_url,
                    crawled_date,
                    job_type,
                    site
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching saved jobs:', error);
        } else {
            // Filter out any where job is null (deleted)
            const validItems = (data || []).filter(item => item.job !== null) as unknown as SavedJobItem[];
            setSavedJobs(validItems);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchSavedJobs();
        }
    }, [user]);

    const handleRemove = async (savedJobId: string) => {
        // Optimistic update
        setSavedJobs(prev => prev.filter(item => item.id !== savedJobId));

        const { error } = await supabase
            .from('saved_jobs')
            .delete()
            .eq('id', savedJobId);

        if (error) {
            console.error("Failed to remove job", error);
            // Revert on error? Or just fetch again.
            fetchSavedJobs();
        }
    };

    if (authLoading || loading) {
        return (
            <div className={styles.loading}>
                Loading saved jobs...
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <Bookmark size={32} className="text-blue-500" />
                    Saved Jobs
                </div>
                <Link href="/jobs" className={styles.backLink}>
                    <ArrowLeft size={18} />
                    Browse More Jobs
                </Link>
            </header>

            {savedJobs.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No saved jobs yet</h2>
                    <p>Jobs you save will appear here for quick access.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {savedJobs.map((item) => (
                        <div key={item.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.jobTitle}>{item.job.title}</h3>
                                    <p className={styles.company}>
                                        <Building size={14} />
                                        {item.job.company}
                                    </p>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className={styles.meta}>
                                <div className={styles.tag}>
                                    <MapPin size={12} />
                                    {item.job.location}
                                </div>
                                <div className={styles.tag}>
                                    <Clock size={12} />
                                    {item.job.job_type || "Full-time"}
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <a
                                    href={item.job.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.applyButton}
                                >
                                    Apply Now <ExternalLink size={16} />
                                </a>
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className={styles.removeButton}
                                    title="Remove from Saved"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
