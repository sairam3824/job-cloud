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
    CheckCircle,
    Building
} from "lucide-react";
import styles from "./applied.module.css";
import Footer from "@/components/Footer";
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

export default function AppliedJobsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [appliedJobs, setAppliedJobs] = useState<SavedJobItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/applied-jobs');
        }
    }, [authLoading, user, router]);

    const fetchAppliedJobs = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('applied_jobs')
            .select(`
                id,
                applied_at,
                job_id,
                job_title,
                company_name,
                location,
                job_url,
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
            .order('applied_at', { ascending: false });

        if (error) {
            console.error('Error fetching applied jobs:', error);
        } else {
            // Map data, using snapshot if live job is missing (deleted)
            const mappedItems = (data || []).map((item: any) => {
                const liveJob = item.job;

                // Construct job object from snapshot if live job is not available
                // or if we want to preserve the snapshot state
                const jobData = liveJob || {
                    id: item.job_id,
                    title: item.job_title || 'Unknown Title',
                    company: item.company_name || 'Unknown Company',
                    location: item.location || 'Unknown Location',
                    job_url: item.job_url || '#',
                    crawled_date: item.applied_at,
                    job_type: 'N/A', // Not stored in snapshot currently
                    site: 'N/A'
                };

                return {
                    id: item.id,
                    created_at: item.applied_at,
                    job: jobData
                };
            });

            setAppliedJobs(mappedItems);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchAppliedJobs();
        }
    }, [user]);

    const handleRemove = async (appliedJobId: string) => {
        if (!confirm("Are you sure you want to remove this job from your applied list?")) return;

        // Optimistic update
        setAppliedJobs(prev => prev.filter(item => item.id !== appliedJobId));

        const { error } = await supabase
            .from('applied_jobs')
            .delete()
            .eq('id', appliedJobId);

        if (error) {
            console.error("Failed to remove job", error);
            // Revert on error? Or just fetch again.
            fetchAppliedJobs();
        }
    };

    if (authLoading || loading) {
        return (
            <div className={styles.loading}>
                Loading applied jobs...
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.title}>
                        <CheckCircle size={32} className="text-emerald-500" style={{ color: '#10b981' }} />
                        Applied Jobs
                    </div>
                    <p className={styles.note}>
                        Track all the jobs you have applied to.
                    </p>
                </div>
                <Link href="/jobs" className={styles.backLink}>
                    <ArrowLeft size={18} />
                    Back to Jobs
                </Link>
            </header>

            {appliedJobs.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No applied jobs yet</h2>
                    <p>Jobs you apply to will be tracked here.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {appliedJobs.map((item) => (
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
                                    Applied: {new Date(item.created_at).toLocaleDateString()}
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
                                    style={{ backgroundColor: '#27272a', borderColor: '#3f3f46' }}
                                >
                                    View Job Link <ExternalLink size={16} />
                                </a>
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className={styles.removeButton}
                                    title="Remove from Applied"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Footer />
        </div>
    );
}
