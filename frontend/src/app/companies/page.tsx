"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, MapPin, Calendar, Briefcase, X, ExternalLink, Globe, User, Clock, TrendingUp, Layers, Bookmark } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useJobs } from "@/context/JobsContext";
import { Job, CompanyGroup } from "@/types";

const SUGGESTED_ROLES = [
    "Software Engineer",
    "Data Scientist",
    "AI Engineer",
    "Business Analyst",
    "Data Analyst",
    "Cloud Engineer",
    "Cybersecurity Analyst",
    "Digital Marketing Specialist",
    "Quality Assurance Engineer",
    "Customer Service Representative"
];

const JOB_TYPES = [
    "Fulltime",
    "Contract",
    "Internship",
    "Apprentice",
    "Parttime"
];

export default function CompaniesPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Use Context for persistent state
    const {
        companyResults: results,
        setCompanyResults: setResults,
        companyQuery: query,
        setCompanyQuery: setQuery,
        hasSearchedCompanies: hasSearched,
        setHasSearchedCompanies: setHasSearched
    } = useJobs();

    const [jobTitleQuery, setJobTitleQuery] = useState("");
    const [jobTypeQuery, setJobTypeQuery] = useState("");
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
    const [showJobTypeSuggestions, setShowJobTypeSuggestions] = useState(false);
    // Local loading state for search action
    const [loading, setLoading] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [savedCompanyNames, setSavedCompanyNames] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    // Fetch saved jobs and companies
    useEffect(() => {
        const fetchSaved = async () => {
            if (!user) {
                setSavedJobIds(new Set());
                setSavedCompanyNames(new Set());
                return;
            }

            // Fetch saved jobs
            const { data: savedJobs } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
            if (savedJobs) {
                setSavedJobIds(new Set(savedJobs.map(d => d.job_id)));
            }

            // Fetch saved companies
            const { data: savedCompanies } = await supabase.from('saved_companies').select('company_name').eq('user_id', user.id);
            if (savedCompanies) {
                setSavedCompanyNames(new Set(savedCompanies.map(c => c.company_name)));
            }
        };
        fetchSaved();
    }, [user]);

    const handleToggleSaveCompany = async (e: React.MouseEvent, companyName: string) => {
        e.preventDefault(); // Stop navigation
        e.stopPropagation();

        if (!user) {
            router.push('/login?redirect=/companies');
            return;
        }

        const isSaved = savedCompanyNames.has(companyName);

        if (isSaved) {
            const { error } = await supabase.from('saved_companies').delete().match({ user_id: user.id, company_name: companyName });
            if (!error) {
                setSavedCompanyNames(prev => {
                    const next = new Set(prev);
                    next.delete(companyName);
                    return next;
                });
            }
        } else {
            const { error } = await supabase.from('saved_companies').insert({ user_id: user.id, company_name: companyName });
            if (!error) {
                setSavedCompanyNames(prev => {
                    const next = new Set(prev);
                    next.add(companyName);
                    return next;
                });
            } else {
                console.error("Failed to save company", error);
            }
        }
    };

    const handleToggleSave = async (jobId: string) => {
        if (!user) {
            router.push('/login?redirect=/companies');
            return;
        }
        if (saving) return;
        setSaving(true);

        const isSaved = savedJobIds.has(jobId);

        if (isSaved) {
            const { error } = await supabase.from('saved_jobs').delete().match({ user_id: user.id, job_id: jobId });
            if (!error) {
                setSavedJobIds(prev => {
                    const next = new Set(prev);
                    next.delete(jobId);
                    return next;
                });
            }
        } else {
            const { error } = await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId });
            if (!error) {
                setSavedJobIds(prev => {
                    const next = new Set(prev);
                    next.add(jobId);
                    return next;
                });
            }
        }
        setSaving(false);
    };

    // Debounce search
    useEffect(() => {
        // If we have results and haven't typed anything new (e.g. initial mount with existing query), 
        // we could optionally skip, but let's refresh to be safe, 
        // but suppress loading indicator if we have data?
        // Actually, let's just search.
        const timer = setTimeout(() => {
            searchCompanies(query, jobTitleQuery, jobTypeQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [query, jobTitleQuery, jobTypeQuery]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedJob(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const searchCompanies = async (companyName: string, title: string, type: string) => {
        // Only show loading if we don't have results? 
        // Or specific UX decision: Loading spinner usually good.
        // If we want "silent update", we can check results.length

        setLoading(true);
        setHasSearched(true);

        try {
            // Start query
            let queryBuilder = supabase
                .from("jobs")
                .select("*");

            if (companyName.trim()) {
                queryBuilder = queryBuilder.ilike("company", `%${companyName}%`);
            }

            // Add optional filters
            if (title.trim()) {
                queryBuilder = queryBuilder.ilike("title", `%${title}%`);
            }
            if (type.trim()) {
                queryBuilder = queryBuilder.ilike("job_type", `%${type}%`);
            }

            const { data, error } = await queryBuilder
                .order("crawled_date", { ascending: false })
                .limit(1000);

            if (error) throw error;

            if (data) {
                // Group by company
                const groups: Record<string, Job[]> = {};
                // Cast data to Job[]
                const jobsData = data as unknown as Job[];

                jobsData.forEach(job => {
                    const company = job.company || "Unknown Company";
                    if (!groups[company]) {
                        groups[company] = [];
                    }
                    groups[company].push(job);
                });

                const groupArray = Object.keys(groups).map(company => ({
                    name: company,
                    jobs: groups[company]
                })).sort((a, b) => a.name.localeCompare(b.name));

                setResults(groupArray);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        if (!user) {
            const returnUrl = encodeURIComponent(window.location.href);
            router.push(`/login?redirect=${returnUrl}`);
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const formatSalary = (job: Job) => {
        if (!job.min_amount && !job.max_amount) return "Not Disclosed";
        const currencyMap: Record<string, string> = { "USD": "$", "INR": "₹", "EUR": "€", "GBP": "£" };
        const symbol = currencyMap[job.currency || "USD"] || job.currency || "$";

        if (job.min_amount && job.max_amount) {
            if (job.min_amount === job.max_amount) {
                return `${symbol}${job.min_amount.toLocaleString()} / ${job.interval || 'yr'}`;
            }
            return `${symbol}${job.min_amount.toLocaleString()} - ${symbol}${job.max_amount.toLocaleString()} / ${job.interval || 'yr'}`;
        }
        if (job.min_amount) return `Min ${symbol}${job.min_amount.toLocaleString()} / ${job.interval || 'yr'}`;
        if (job.max_amount) return `Max ${symbol}${job.max_amount.toLocaleString()} / ${job.interval || 'yr'}`;
        return "Not Disclosed";
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Company Search</h1>
                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search for a company..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </header>

                <div className={styles.filtersLine}>
                    <div className={styles.filterContainer}>
                        <Briefcase size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.filterInput}
                            placeholder="Job Title"
                            value={jobTitleQuery}
                            onChange={(e) => setJobTitleQuery(e.target.value)}
                            onFocus={(e) => {
                                setShowRoleSuggestions(true);
                                e.target.select();
                            }}
                            onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                        />
                        {showRoleSuggestions && (
                            <div className={styles.suggestionsPopup}>
                                {SUGGESTED_ROLES.filter(r => {
                                    if (SUGGESTED_ROLES.some(role => role.toLowerCase() === jobTitleQuery.toLowerCase())) {
                                        return true;
                                    }
                                    return r.toLowerCase().includes(jobTitleQuery.toLowerCase());
                                }).map((role) => (
                                    <div
                                        key={role}
                                        className={styles.suggestionItem}
                                        onMouseDown={() => {
                                            setJobTitleQuery(role);
                                            setShowRoleSuggestions(false);
                                        }}
                                    >
                                        {role}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={styles.filterContainer}>
                        <Clock size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.filterInput}
                            placeholder="Job Type"
                            value={jobTypeQuery}
                            onChange={(e) => setJobTypeQuery(e.target.value)}
                            onFocus={(e) => {
                                setShowJobTypeSuggestions(true);
                                e.target.select();
                            }}
                            onBlur={() => setTimeout(() => setShowJobTypeSuggestions(false), 200)}
                        />
                        {showJobTypeSuggestions && (
                            <div className={styles.suggestionsPopup}>
                                {JOB_TYPES.filter(t => {
                                    if (JOB_TYPES.some(type => type.toLowerCase() === jobTypeQuery.toLowerCase())) {
                                        return true;
                                    }
                                    return t.toLowerCase().includes(jobTypeQuery.toLowerCase());
                                }).map((type) => (
                                    <div
                                        key={type}
                                        className={styles.suggestionItem}
                                        onMouseDown={() => {
                                            setJobTypeQuery(type);
                                            setShowJobTypeSuggestions(false);
                                        }}
                                    >
                                        {type}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.resultsArea}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            Searching, Hold tight...
                        </div>
                    ) : results.length > 0 ? (
                        <div className={styles.logoGrid}>
                            {results.map((group) => (
                                <div
                                    key={group.name}
                                    className={styles.logoItem}
                                    onClick={() => router.push(`/companies/${encodeURIComponent(group.name)}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            router.push(`/companies/${encodeURIComponent(group.name)}`);
                                        }
                                    }}
                                >
                                    <button
                                        onClick={(e) => handleToggleSaveCompany(e, group.name)}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'rgba(0,0,0,0.5)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            padding: '6px',
                                            cursor: 'pointer',
                                            zIndex: 20,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: savedCompanyNames.has(group.name) ? '#3b82f6' : 'white',
                                            transition: 'transform 0.2s'
                                        }}
                                        title={savedCompanyNames.has(group.name) ? "Unsave Company" : "Save Company"}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <Bookmark size={14} fill={savedCompanyNames.has(group.name) ? "currentColor" : "none"} />
                                    </button>

                                    {group.jobs[0].company_logo ? (
                                        <img
                                            src={group.jobs[0].company_logo}
                                            alt={`${group.name} logo`}
                                            className={styles.logoImage}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.removeAttribute('style');
                                            }}
                                        />
                                    ) : null}

                                    <Briefcase
                                        size={32}
                                        className={`${styles.fallbackIcon} fallback-icon`}
                                        style={{ display: group.jobs[0].company_logo ? 'none' : 'block' }}
                                    />

                                    <div className={styles.companyNameTooltip}>
                                        {group.name}
                                        <span style={{ opacity: 0.8, marginLeft: '8px', fontWeight: 400, fontSize: '0.75em' }}>
                                            {group.jobs.length} {group.jobs.length === 1 ? 'Job' : 'Jobs'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (hasSearched && query.trim()) ? (
                        <div className={styles.loadingState}>
                            No companies found matching "{query}"
                        </div>
                    ) : (
                        <div className={styles.loadingState}>
                            Enter a company name to see their history.
                        </div>
                    )}
                </div>

            </div>
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.capstone}>
                        Developed as a Capstone Project
                    </div>

                    <div className={styles.centerBlock}>
                        <div className={styles.copy}>
                            &copy; {new Date().getFullYear()} HireMind. All rights reserved.
                        </div>
                    </div>

                    <div className={styles.footerLinks}>
                        <Link href="/privacy-policy">Privacy Policy</Link>
                        <Link href="/terms-conditions">Terms & Conditions</Link>
                    </div>
                </div>
            </footer>

            {/* Job Details Modal */}
            {selectedJob && (
                <div className={styles.modalOverlay} onClick={() => setSelectedJob(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={() => setSelectedJob(null)}>
                            <X size={24} />
                        </button>

                        <div className={styles.modalBody}>
                            <div className={styles.detailsHeader}>
                                <h2>{selectedJob.title}</h2>
                                <div className={styles.detailsMeta}>
                                    <span>{selectedJob.company}</span>
                                    <span className={styles.dot}>•</span>
                                    <span>{selectedJob.location}</span>
                                    <span className={styles.dot}>•</span>
                                    <span>{selectedJob.crawled_date}</span>
                                </div>

                                <a
                                    href={selectedJob.job_url}
                                    onClick={(e) => handleApply(e, selectedJob.job_url)}
                                    className={styles.applyLink}
                                >
                                    Apply on Company Site <ExternalLink size={16} />
                                </a>
                                <button
                                    onClick={() => handleToggleSave(selectedJob.id)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #3f3f46',
                                        color: 'white',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.375rem',
                                        marginLeft: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                    title={savedJobIds.has(selectedJob.id) ? "Unsave Job" : "Save Job"}
                                >
                                    <Bookmark
                                        size={18}
                                        fill={savedJobIds.has(selectedJob.id) ? "currentColor" : "none"}
                                        color={savedJobIds.has(selectedJob.id) ? "#3b82f6" : "currentColor"}
                                    />
                                </button>
                            </div>

                            <div className={styles.scrollArea}>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoBox}>
                                        <div className={styles.boxHeader}>
                                            <span className={styles.infoLabel}>Source</span>
                                            <Globe size={16} className={styles.boxIcon} />
                                        </div>
                                        <span className={styles.infoValue}>
                                            {selectedJob.site || "N/A"}
                                        </span>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <div className={styles.boxHeader}>
                                            <span className={styles.infoLabel}>Experience</span>
                                            <TrendingUp size={16} className={styles.boxIcon} />
                                        </div>
                                        <span className={styles.infoValue}>
                                            {selectedJob.job_level || "Not specified"}
                                        </span>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <div className={styles.boxHeader}>
                                            <span className={styles.infoLabel}>Job Type</span>
                                            <Clock size={16} className={styles.boxIcon} />
                                        </div>
                                        <span className={styles.infoValue}>
                                            {selectedJob.job_type || "Fulltime"}
                                        </span>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <div className={styles.boxHeader}>
                                            <span className={styles.infoLabel}>Remote</span>
                                            <MapPin size={16} className={styles.boxIcon} />
                                        </div>
                                        <span className={styles.infoValue}>
                                            No
                                        </span>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <div className={styles.boxHeader}>
                                            <span className={styles.infoLabel}>Role</span>
                                            <User size={16} className={styles.boxIcon} />
                                        </div>
                                        <span className={styles.infoValue} title={selectedJob.title}>
                                            {selectedJob.title}
                                        </span>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <div className={styles.boxHeader}>
                                            <span className={styles.infoLabel}>Function</span>
                                            <Layers size={16} className={styles.boxIcon} />
                                        </div>
                                        <span className={styles.infoValue}>
                                            N/A
                                        </span>
                                    </div>
                                </div>

                                <span className={styles.sectionTitle}>Job Description</span>
                                <div className={styles.descriptionText}>
                                    <ReactMarkdown>
                                        {selectedJob.description || "No description available."}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
