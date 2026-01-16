"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from 'react-markdown';
import {
    Calendar as CalendarIcon,
    MapPin,
    Briefcase,
    ExternalLink,
    Search,
    Clock,
    ChevronRight,
    Globe,
    ArrowLeft,
    User,
    TrendingUp,
    Layers,
    RefreshCw,
    Share2,
    CheckCircle,
    Bookmark
} from "lucide-react";
import styles from "./page.module.css";
import Calendar from "@/components/Calendar";

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


// Helper to format job type nicely (e.g. "contract" -> "Contract")
const formatJobType = (type: string | null | undefined) => {
    if (!type) return "N/A";
    return type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};



type Job = {
    id: string;
    title: string;
    company: string;
    location: string;
    job_url: string;
    site: string;
    crawled_date: string;
    description: string;
    job_type: string;
    job_url_direct?: string;
    is_remote?: boolean;
    job_level?: string;
    role?: string;
    job_function?: string;
    company_logo?: string;
};

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

const SUGGESTED_CITIES = [
    "Mumbai",
    "Chennai",
    "Hyderabad",
    "Bengaluru",
    "Pune",
    "Kolkata"
];

const JOB_TYPES = [
    "Fulltime",
    "Contract",
    "Internship",
    "Apprentice",
    "Parttime"
];

const JOB_LEVELS = [
    "Internship",
    "Entry level",
    "Associate",
    "Mid-Senior level",
    "Director",
    "Executive"
];

import { useAuth } from "@/context/AuthContext";

export default function Home() {
    // State
    const { user } = useAuth();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    // Fetch saved jobs
    useEffect(() => {
        const fetchSaved = async () => {
            if (!user) {
                setSavedJobIds(new Set());
                return;
            }
            const { data } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
            if (data) {
                setSavedJobIds(new Set(data.map(d => d.job_id)));
            }
        };
        fetchSaved();
    }, [user]);

    const handleToggleSave = async (jobId: string) => {
        if (!user) {
            router.push('/login?redirect=/jobs');
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

    // URL Handling
    useEffect(() => {
        // Function to handle URL params
        const handleUrlParams = () => {
            const params = new URLSearchParams(window.location.search);
            const jobId = params.get('jobId');
            if (jobId && jobs.length > 0) {
                const job = jobs.find(j => j.id === jobId);
                if (job) {
                    setSelectedJob(job);
                }
            }
        };

        handleUrlParams();
    }, [jobs]);

    const handleSelectJob = (job: Job | null) => {
        setSelectedJob(job);
        if (job) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('jobId', job.id);
            window.history.pushState({}, '', newUrl.toString());
        } else {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('jobId');
            window.history.pushState({}, '', newUrl.toString());
        }
    };

    const handleShare = async () => {
        if (!selectedJob) return;
        const shareUrl = `${window.location.origin}/jobs?jobId=${selectedJob.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err) {
            console.error("Failed to copy link: ", err);
        }
    };

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [companyQuery, setCompanyQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [jobTypeQuery, setJobTypeQuery] = useState("");
    const [jobLevelQuery, setJobLevelQuery] = useState("");

    // Suggestion Visibility State
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const [showJobTypeSuggestions, setShowJobTypeSuggestions] = useState(false);
    const [showJobLevelSuggestions, setShowJobLevelSuggestions] = useState(false);

    // Calendar State
    const [showCal, setShowCal] = useState(false);

    const handleQuickDate = (d: number) => {
        const x = new Date();
        x.setDate(x.getDate() + d);
        setSelectedDate(x);
        fetchJobs(x);
        setShowCal(false);
    };

    const [error, setError] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Fetch dates
    useEffect(() => {
        async function fetchDates() {
            try {
                // First get the most recent date from the DB
                const { data: recentDateData, error: recentError } = await supabase
                    .from("jobs")
                    .select("crawled_date")
                    .order("crawled_date", { ascending: false })
                    .limit(1)
                    .single();

                if (recentDateData) {
                    const latestDate = new Date(recentDateData.crawled_date);
                    setSelectedDate(latestDate);
                    fetchJobs(latestDate);
                } else {
                    // Fallback to today if no jobs found
                    fetchJobs(new Date());
                }

                // Initial fetch logic to populate the calendar
                let allDates: string[] = [];
                let from = 0;
                const batchSize = 1000;
                let moreAvailable = true;

                while (moreAvailable) {
                    const { data, error } = await supabase
                        .from("jobs")
                        .select("crawled_date")
                        .range(from, from + batchSize - 1);

                    if (error) throw error;

                    if (data) {
                        const dates = data.map(j => j.crawled_date);
                        allDates = [...allDates, ...dates];

                        if (data.length < batchSize) {
                            moreAvailable = false;
                        } else {
                            from += batchSize;
                        }
                    } else {
                        moreAvailable = false;
                    }
                }

                if (allDates.length > 0) {
                    setAvailableDates(new Set(allDates));
                }
            } catch (e) {
                console.error("Error fetching dates", e);
                fetchJobs(new Date()); // Fallback on error
            }
        }
        fetchDates();
    }, []);

    const fetchJobs = async (date: Date) => {
        setLoading(true);
        setError(false);
        const dateStr = formatDate(date);

        try {
            let allJobs: Job[] = [];
            let from = 0;
            const batchSize = 1000;
            let moreAvailable = true;

            while (moreAvailable) {
                const { data, error: sbError } = await supabase
                    .from("jobs")
                    .select("*")
                    .eq("crawled_date", dateStr)
                    .order("created_at", { ascending: false })
                    .range(from, from + batchSize - 1);

                if (sbError) {
                    throw sbError;
                }

                if (data) {
                    allJobs = [...allJobs, ...data];
                    if (data.length < batchSize) {
                        moreAvailable = false;
                    } else {
                        from += batchSize;
                    }
                } else {
                    moreAvailable = false;
                }
            }

            console.log(`Fetched total ${allJobs.length} jobs for ${dateStr}`);

            setJobs(allJobs);
            if (allJobs.length > 0) {
                setSelectedJob(null);
            } else {
                setSelectedJob(null);
            }
        } catch (e) {
            console.error(e);
            setJobs([]);
            setError(true);
        }
        setLoading(false);
    };

    // Filter jobs based on search
    const filteredJobs = jobs.filter(job => {
        // Normalize queries
        const normSearch = searchQuery.trim().toLowerCase();
        const normCompany = companyQuery.trim().toLowerCase();
        const normLocation = locationQuery.trim().toLowerCase();
        const normType = jobTypeQuery.trim().toLowerCase();
        const normLevel = jobLevelQuery.trim().toLowerCase();

        // Normalize job data (handle nulls safely)
        const jobTitle = (job.title || "").toLowerCase();
        const jobCompany = (job.company || "").toLowerCase();
        const jobLocation = (job.location || "").toLowerCase();
        const jobType = (job.job_type || "").toLowerCase();
        const jobLevel = (job.job_level || "").toLowerCase();

        const matchesTitle = normSearch ? jobTitle.includes(normSearch) : true;
        const matchesCompany = normCompany ? jobCompany.includes(normCompany) : true;
        const matchesLocation = normLocation ? jobLocation.includes(normLocation) : true;
        const matchesJobType = normType ? jobType.includes(normType) : true;

        let matchesJobLevel = true;
        if (normLevel) {
            if (!jobLevel || jobLevel === "not applicable") {
                matchesJobLevel = true;
            } else {
                matchesJobLevel = jobLevel.includes(normLevel);
            }
        }

        return matchesTitle && matchesCompany && matchesLocation && matchesJobType && matchesJobLevel;
    });

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        if (!isNaN(newDate.getTime())) {
            setSelectedDate(newDate);
            fetchJobs(newDate);
        }
    };

    // Swipe Logic
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isRightSwipe = distance < -50;

        if (isRightSwipe) {
            handleSelectJob(null);
        }
    }

    const handleApply = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        if (!user) {
            const returnUrl = encodeURIComponent(window.location.href);
            router.push(`/login?redirect=${returnUrl}`);
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Navigation / Search Bar */}
            <header className={styles.header}>
                <div className={styles.headerContent}>

                    {/* Search Inputs */}
                    <div className={styles.searchBar}>
                        {/* ... (keep existing) ... */}
                        <div className={styles.searchInputGroup}>
                            <Search className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                placeholder="Job title"
                                className={styles.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={(e) => {
                                    setShowRoleSuggestions(true);
                                    e.target.select();
                                }}
                                onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                            />
                            {showRoleSuggestions && (
                                <div className={styles.suggestionsPopup}>
                                    {SUGGESTED_ROLES.filter(r => {
                                        if (SUGGESTED_ROLES.some(role => role.toLowerCase() === searchQuery.toLowerCase())) {
                                            return true;
                                        }
                                        return r.toLowerCase().includes(searchQuery.toLowerCase());
                                    }).map((role) => (
                                        <div
                                            key={role}
                                            className={styles.suggestionItem}
                                            onMouseDown={() => {
                                                setSearchQuery(role);
                                                setShowRoleSuggestions(false);
                                            }}
                                        >
                                            {role}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.searchDivider}></div>

                        <div className={styles.searchInputGroup}>
                            <Briefcase className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                placeholder="Company"
                                className={styles.searchInput}
                                value={companyQuery}
                                onChange={(e) => setCompanyQuery(e.target.value)}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>

                        <div className={styles.searchDivider}></div>

                        {/* Job Type Search Input */}
                        <div className={styles.searchInputGroup}>
                            <Clock className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                placeholder="Job type"
                                className={styles.searchInput}
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
                                        // If the current query matches exactly one of the types, show all (don't filter)
                                        // This allows the user to switch easily after selecting one.
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

                        <div className={styles.searchDivider}></div>

                        {/* Job Level Search Input */}
                        <div className={styles.searchInputGroup}>
                            <Briefcase className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                placeholder="Experience"
                                className={styles.searchInput}
                                value={jobLevelQuery}
                                onChange={(e) => setJobLevelQuery(e.target.value)}
                                onFocus={(e) => {
                                    setShowJobLevelSuggestions(true);
                                    e.target.select();
                                }}
                                onBlur={() => setTimeout(() => setShowJobLevelSuggestions(false), 200)}
                            />
                            {showJobLevelSuggestions && (
                                <div className={styles.suggestionsPopup}>
                                    {JOB_LEVELS.filter(l => {
                                        if (JOB_LEVELS.some(level => level.toLowerCase() === jobLevelQuery.toLowerCase())) {
                                            return true;
                                        }
                                        return l.toLowerCase().includes(jobLevelQuery.toLowerCase());
                                    }).map((level) => (
                                        <div
                                            key={level}
                                            className={styles.suggestionItem}
                                            onMouseDown={() => {
                                                setJobLevelQuery(level);
                                                setShowJobLevelSuggestions(false);
                                            }}
                                        >
                                            {level}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.searchDivider}></div>

                        {/* Location Search Input */}
                        <div className={styles.searchInputGroup}>
                            <MapPin className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                placeholder="City or location"
                                className={styles.searchInput}
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                onFocus={(e) => {
                                    setShowCitySuggestions(true);
                                    e.target.select();
                                }}
                                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                            />
                            {showCitySuggestions && (
                                <div className={styles.suggestionsPopup}>
                                    {SUGGESTED_CITIES.filter(c => {
                                        if (SUGGESTED_CITIES.some(city => city.toLowerCase() === locationQuery.toLowerCase())) {
                                            return true;
                                        }
                                        return c.toLowerCase().includes(locationQuery.toLowerCase());
                                    }).map((city) => (
                                        <div
                                            key={city}
                                            className={styles.suggestionItem}
                                            onMouseDown={() => {
                                                setLocationQuery(city);
                                                setShowCitySuggestions(false);
                                            }}
                                        >
                                            <MapPin size={14} />
                                            {city}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className={styles.findButton}>
                            Find jobs
                        </button>
                    </div>

                    {/* Date Picker (Simple) */}


                    <div className={styles.premiumCalendar}>
                        <button className={styles.calendarPill} onClick={() => setShowCal(!showCal)}>
                            <CalendarIcon size={18} />
                            {selectedDate.toDateString()}
                        </button>

                        {showCal && (
                            <div className={styles.calendarPopup}>
                                {/* Show selected date as text box at top (read only or strictly display) */}
                                <div className={styles.selectedDateDisplay}>
                                    {formatDate(selectedDate).split('-').reverse().join('/')}
                                </div>

                                <div className={styles.quickDates}>
                                    <button onClick={() => handleQuickDate(0)}>Today</button>
                                    <button onClick={() => handleQuickDate(-1)}>Yesterday</button>
                                    <button onClick={() => handleQuickDate(-2)}>2 Days Ago</button>
                                </div>

                                <Calendar
                                    selectedDate={selectedDate}
                                    onChange={(date) => {
                                        setSelectedDate(date);
                                        fetchJobs(date);
                                    }}
                                    onClose={() => setShowCal(false)}
                                />
                            </div>
                        )}
                    </div>

                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>

                {/* Left Column: Job List */}
                <div className={styles.jobList}>
                    <div className={styles.listHeader}>
                        <h2>Jobs for you</h2>
                        <span>{filteredJobs.length} Jobs Fetched</span>
                    </div>

                    {loading ? (
                        <>
                            <div className={styles.loadingMessage}>Hold on, data is fetching...</div>
                            {[1, 2, 3].map(i => (
                                <div key={i} className={styles.skeletonCard} />
                            ))}
                        </>
                    ) : error ? (
                        <div className={styles.emptyState}>
                            <p>Something went wrong loading jobs.</p>
                            <button
                                className={styles.refreshButton}
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw size={16} />
                                Refresh Page
                            </button>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className={styles.emptyState}>
                            No jobs found for this date.
                        </div>
                    ) : (
                        <div className={styles.cardsContainer}>
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    onClick={() => handleSelectJob(job)}
                                    className={`${styles.card} ${selectedJob?.id === job.id ? styles.activeCard : ''}`}
                                >
                                    <div className={styles.cardHeader}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            {job.company_logo ? (
                                                <img
                                                    src={job.company_logo}
                                                    alt={`${job.company} logo`}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        objectFit: 'contain',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'white',
                                                        padding: '2px',
                                                        flexShrink: 0
                                                    }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : null}
                                            <h3 className={styles.jobTitle}>
                                                {job.title}
                                            </h3>
                                        </div>
                                        {selectedJob?.id === job.id && (
                                            <ChevronRight className={styles.activeIcon} size={20} />
                                        )}
                                    </div>
                                    <p className={styles.companyName}>{job.company}</p>

                                    <div className={styles.tags}>
                                        <span className={styles.tag}>{job.location}</span>
                                        {job.site && (
                                            <span className={styles.tag}>{job.site}</span>
                                        )}
                                    </div>

                                    <div className={styles.postedDate}>
                                        <Clock size={12} />
                                        Posted {job.crawled_date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Job Details (Sticky) */}
                <div
                    className={`${styles.jobDetails} ${selectedJob ? styles.showOnMobile : ''}`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {selectedJob ? (
                        <div className={styles.detailsContainer}>
                            {/* Job Header */}
                            <div className={styles.detailsHeader}>
                                {/* Back Button for Mobile */}
                                <div className={styles.backButton} onClick={() => handleSelectJob(null)}>
                                    <ArrowLeft size={16} /> Back to all jobs
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    {selectedJob.company_logo && (
                                        <img
                                            src={selectedJob.company_logo}
                                            alt={`${selectedJob.company} logo`}
                                            style={{
                                                width: '56px',
                                                height: '56px',
                                                objectFit: 'contain',
                                                borderRadius: '8px',
                                                backgroundColor: 'white',
                                                padding: '4px',
                                                flexShrink: 0
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <h1 style={{ margin: 0, fontSize: '1.875rem', lineHeight: 1.2 }}>{selectedJob.title}</h1>
                                </div>
                                <div className={styles.detailsMeta}>
                                    <span className={styles.companyLink}>{selectedJob.company}</span>
                                    <span className={styles.dot}>•</span>
                                    <span>{selectedJob.location}</span>
                                </div>

                                <div className={styles.actionButtons}>
                                    {selectedJob.job_url_direct && selectedJob.job_url_direct !== 'NULL' && (
                                        <a
                                            href={selectedJob.job_url_direct}
                                            onClick={(e) => handleApply(e, selectedJob.job_url_direct!)}
                                            className={styles.applyButton}
                                        >
                                            Apply Direct
                                            <ExternalLink size={18} />
                                        </a>
                                    )}
                                    <a
                                        href={selectedJob.job_url}
                                        onClick={(e) => handleApply(e, selectedJob.job_url)}
                                        className={
                                            (selectedJob.job_url_direct && selectedJob.job_url_direct !== 'NULL')
                                                ? styles.saveButton
                                                : styles.applyButton
                                        }
                                    >
                                        {selectedJob.site ? `Apply on ${selectedJob.site}` : "Apply now"}
                                        <ExternalLink size={18} />
                                    </a>
                                    <button
                                        onClick={() => handleToggleSave(selectedJob.id)}
                                        className={styles.shareButton}
                                        title={savedJobIds.has(selectedJob.id) ? "Unsave Job" : "Save Job"}
                                    >
                                        <Bookmark
                                            size={18}
                                            fill={savedJobIds.has(selectedJob.id) ? "currentColor" : "none"}
                                            color={savedJobIds.has(selectedJob.id) ? "#3b82f6" : "currentColor"}
                                        />
                                    </button>
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            onClick={handleShare}
                                            className={styles.shareButton}
                                            title="Share Job"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                        {showToast && (
                                            <div className={styles.toast}>
                                                <CheckCircle size={18} color="#4ade80" />
                                                Link Copied!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Job Content Scrollable Area */}
                            <div className={styles.detailsContent}>
                                <div className={styles.detailsSection}>
                                    <h3>Job Details</h3>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoBox}>
                                            <div className={styles.boxHeader}>
                                                <span className={styles.infoLabel}>Source</span>
                                                <Globe size={16} className={styles.boxIcon} />
                                            </div>
                                            <span className={styles.infoValue}>
                                                {selectedJob.site}
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
                                                {formatJobType(selectedJob.job_type)}
                                            </span>
                                        </div>
                                        <div className={styles.infoBox}>
                                            <div className={styles.boxHeader}>
                                                <span className={styles.infoLabel}>Remote</span>
                                                <MapPin size={16} className={styles.boxIcon} />
                                            </div>
                                            <span className={styles.infoValue}>
                                                {selectedJob.is_remote ? "Yes" : "No"}
                                            </span>
                                        </div>
                                        <div className={styles.infoBox}>
                                            <div className={styles.boxHeader}>
                                                <span className={styles.infoLabel}>Role</span>
                                                <User size={16} className={styles.boxIcon} />
                                            </div>
                                            <span className={styles.infoValue} title={selectedJob.role || ""}>
                                                {selectedJob.role || "N/A"}
                                            </span>
                                        </div>
                                        <div className={styles.infoBox}>
                                            <div className={styles.boxHeader}>
                                                <span className={styles.infoLabel}>Function</span>
                                                <Layers size={16} className={styles.boxIcon} />
                                            </div>
                                            <span className={styles.infoValue}>
                                                {selectedJob.job_function || "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    <h3>Full Description</h3>
                                    <div className={styles.descriptionText}>
                                        <ReactMarkdown>
                                            {selectedJob.description || "No description available."}
                                        </ReactMarkdown>

                                        <div className={styles.disclaimer}>
                                            Note: This listing was aggregated automatically. Please verify details on the employer's site.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyDetails}>
                            <Briefcase size={64} opacity={0.2} />
                            <p>Select a job to view details</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
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

        </div>
    );
}
