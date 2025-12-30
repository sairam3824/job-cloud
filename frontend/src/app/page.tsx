"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, MapPin, Briefcase, ExternalLink, Globe } from "lucide-react";

type Job = {
    id: string;
    title: string;
    company: string;
    location: string;
    job_url: string;
    site: string;
    crawled_date: string;
};

export default function Home() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

    // Format date as YYYY-MM-DD for database query
    const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    // Fetch dates that have jobs
    useEffect(() => {
        async function fetchDates() {
            const { data, error } = await supabase
                .from("jobs")
                .select("crawled_date");

            if (data) {
                const dates = new Set(data.map((job) => job.crawled_date));
                setAvailableDates(dates);
            }
        }
        fetchDates();

        // Also fetch jobs for initial date (today)
        fetchJobs(new Date());
    }, []);

    const fetchJobs = async (date: Date) => {
        setLoading(true);
        const dateStr = formatDate(date);

        const { data, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("crawled_date", dateStr)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching jobs:", error);
        } else {
            setJobs(data || []);
        }
        setLoading(false);
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        fetchJobs(date);
    };

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-12 text-center animate-fade-in">
                <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500 mb-4">
                    Job Cloud
                </h1>
                <p className="text-gray-400 text-lg">
                    Daily curated job listings for Software Engineers
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Calendar Sidebar */}
                <div className="lg:col-span-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <div className="glass p-6 rounded-2xl sticky top-8">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-pink-500" />
                            Select Date
                        </h2>
                        <CalendarComponent
                            selectedDate={selectedDate}
                            onDateSelect={handleDateClick}
                            availableDates={availableDates}
                        />

                        <div className="mt-8 pt-6 border-t border-gray-700">
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Stats</h3>
                            <div className="flex justify-between items-center text-sm">
                                <span>Jobs Found:</span>
                                <span className="font-bold text-white">{jobs.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Job Feed */}
                <div className="lg:col-span-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            Jobs for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass h-32 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="glass p-12 rounded-xl text-center text-gray-400">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No jobs found for this date.</p>
                            <p className="text-sm mt-2">Try selecting a different date from the calendar.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {jobs.map((job) => (
                                <JobCard key={job.id} job={job} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

// Simple Calendar Component
function CalendarComponent({
    selectedDate,
    onDateSelect,
    availableDates
}: {
    selectedDate: Date,
    onDateSelect: (d: Date) => void,
    availableDates: Set<string>
}) {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayIndex = firstDay.getDay(); // 0 is Sunday

    const days = [];
    // Padding for previous month
    for (let i = 0; i < startingDayIndex; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();

    for (let i = 1; i <= daysInMonth; i++) {
        const currentPriceDate = new Date(year, month, i);
        const dateStr = currentPriceDate.toISOString().split("T")[0];
        const hasJobs = availableDates.has(dateStr);
        const isSelected = isSameDay(currentPriceDate, selectedDate);
        const isToday = isSameDay(currentPriceDate, new Date());

        days.push(
            <div
                key={i}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasJobs ? 'has-jobs' : ''}`}
                onClick={() => onDateSelect(currentPriceDate)}
            >
                {i}
            </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-4 font-medium text-lg">
                {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            <div className="calendar-grid text-gray-400 mb-2 text-xs font-semibold uppercase tracking-wider">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="calendar-grid">
                {days}
            </div>
        </div>
    );
}

function JobCard({ job }: { job: Job }) {
    return (
        <div className="glass glass-hover p-6 rounded-xl job-card relative group">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                        <span className="flex items-center gap-1">
                            <Briefcase size={14} /> {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin size={14} /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                            <Globe size={14} /> {job.site}
                        </span>
                    </div>
                </div>
                <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary hover:bg-primary-hover text-white p-2 rounded-lg transition-colors"
                >
                    <ExternalLink size={20} />
                </a>
            </div>

            {/* Optional: Add Description Snippet later if needed */}
        </div>
    );
}
