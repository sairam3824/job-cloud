"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Job, CompanyGroup } from "@/types";
import { supabase } from "@/lib/supabase";

interface JobsContextType {
    // Jobs Page State
    jobs: Job[];
    loading: boolean;
    error: boolean;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    availableDates: Set<string>;
    fetchJobs: (date: Date) => Promise<void>;

    // Companies Page State
    companyResults: CompanyGroup[];
    setCompanyResults: (results: CompanyGroup[]) => void;
    companyQuery: string;
    setCompanyQuery: (query: string) => void;
    hasSearchedCompanies: boolean;
    setHasSearchedCompanies: (hasSearched: boolean) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider = ({ children }: { children: ReactNode }) => {
    // --- Jobs Page State ---
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

    // Simple in-memory cache: dateString -> Job[]
    const [jobsCache, setJobsCache] = useState<Record<string, Job[]>>({});
    const [initialized, setInitialized] = useState(false);

    // --- Companies Page State ---
    const [companyResults, setCompanyResults] = useState<CompanyGroup[]>([]);
    const [companyQuery, setCompanyQuery] = useState("");
    const [hasSearchedCompanies, setHasSearchedCompanies] = useState(false);


    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchJobs = useCallback(async (date: Date) => {
        const dateStr = formatDate(date);

        // Check cache first
        if (jobsCache[dateStr]) {
            setJobs(jobsCache[dateStr]);
            return;
        }

        setLoading(true);
        setError(false);

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
                    .order("id", { ascending: true })
                    .range(from, from + batchSize - 1);

                if (sbError) {
                    throw sbError;
                }

                if (data) {
                    const typedData = data as unknown as Job[];
                    allJobs = [...allJobs, ...typedData];

                    if (data.length < batchSize) {
                        moreAvailable = false;
                    } else {
                        from += batchSize;
                    }
                } else {
                    moreAvailable = false;
                }
            }

            // Deduplicate
            const uniqueJobs = Array.from(new Map(allJobs.map(item => [item.id, item])).values());

            console.log(`Fetched total ${uniqueJobs.length} unique jobs via Context for ${dateStr}`);

            setJobs(uniqueJobs);

            // Update cache
            setJobsCache(prev => ({
                ...prev,
                [dateStr]: uniqueJobs
            }));

        } catch (e) {
            console.error(e);
            setJobs([]);
            setError(true);
        }
        setLoading(false);
    }, [jobsCache]);

    // Initialize dates and initial job fetch
    useEffect(() => {
        if (initialized) return;

        const init = async () => {
            try {
                // Get most recent date first
                const { data: recentDateData } = await supabase
                    .from("jobs")
                    .select("crawled_date")
                    .order("crawled_date", { ascending: false })
                    .limit(1)
                    .single();

                let initialDate = new Date();
                if (recentDateData) {
                    initialDate = new Date(recentDateData.crawled_date);
                    setSelectedDate(initialDate);
                }

                // Trigger initial fetch
                await fetchJobs(initialDate);

                // Fetch all available dates for calendar
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

                setInitialized(true);

            } catch (e) {
                console.error("Error initializing JobsContext", e);
                // Fallback
                await fetchJobs(new Date());
                setInitialized(true);
            }
        };

        init();
    }, [initialized, fetchJobs]);

    return (
        <JobsContext.Provider value={{
            jobs,
            loading,
            error,
            selectedDate,
            setSelectedDate,
            availableDates,
            fetchJobs,
            companyResults,
            setCompanyResults,
            companyQuery,
            setCompanyQuery,
            hasSearchedCompanies,
            setHasSearchedCompanies
        }}>
            {children}
        </JobsContext.Provider>
    );
};

export const useJobs = () => {
    const context = useContext(JobsContext);
    if (context === undefined) {
        throw new Error("useJobs must be used within a JobsProvider");
    }
    return context;
};
