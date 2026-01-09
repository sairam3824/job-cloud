'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { Loader2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

type Feedback = {
    id: string;
    created_at: string;
    feedback_type: string;
    content: string;
    status?: string | null;
};

type SortConfig = {
    key: keyof Feedback;
    direction: 'asc' | 'desc';
} | null;

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'dismissed', label: 'Dismissed' }
];

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [showRLSModal, setShowRLSModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFeedbacks(data || []);
        } catch (error: any) {
            console.error('Error fetching feedback:', error);
            setErrorMessage(error.message || "Unknown error");
            if (error.code === '42501' || error.message?.includes('policy')) {
                setShowRLSModal(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof Feedback) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);

        // Optimistic update
        const originalFeedbacks = [...feedbacks];
        setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: newStatus } : f));

        try {
            const { error } = await supabase
                .from('feedback')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) {
                // Revert on error
                console.error('Error updating status:', error);
                setFeedbacks(originalFeedbacks);
                setErrorMessage(error.message);
                setShowRLSModal(true);
            }
        } catch (err: any) {
            console.error(err);
            setFeedbacks(originalFeedbacks);
            setErrorMessage(err.message || "Unknown error");
            setShowRLSModal(true);
        } finally {
            setUpdatingId(null);
        }
    };

    const getSortedFeedbacks = (list: Feedback[]) => {
        if (!sortConfig) return list;

        return [...list].sort((a, b) => {
            const valueA = a[sortConfig.key] || '';
            const valueB = b[sortConfig.key] || '';

            if (valueA < valueB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'role_request': return 'Role Request';
            case 'location_request': return 'Location Request';
            case 'general_feedback': return 'General Feedback';
            default: return type.replace(/_/g, ' ');
        }
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'role_request': return styles.typeRole;
            case 'location_request': return styles.typeLocation;
            default: return styles.typeFeedback;
        }
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof Feedback }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className={styles.sortIcon} />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className={styles.sortIcon} color="#60a5fa" />
            : <ArrowDown size={14} className={styles.sortIcon} color="#60a5fa" />;
    };

    const FeedbackTable = ({ data, title }: { data: Feedback[], title: string }) => {
        if (data.length === 0) return null;

        return (
            <div className={styles.sectionContainer}>
                <h2 className={styles.sectionTitle}>{title}</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('created_at')}>
                                    <div className={styles.headerContent}>
                                        Date <SortIcon columnKey="created_at" />
                                    </div>
                                </th>
                                {/* Removed Type column since it's redundant in categorized tables */}
                                <th onClick={() => handleSort('content')}>
                                    <div className={styles.headerContent}>
                                        Content <SortIcon columnKey="content" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')}>
                                    <div className={styles.headerContent}>
                                        Status <SortIcon columnKey="status" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {getSortedFeedbacks(data).map((item) => (
                                <tr key={item.id}>
                                    <td className={styles.dateCell}>{formatDate(item.created_at)}</td>
                                    {/* Removed Type cell */}
                                    <td className={styles.contentCell} title={item.content}>{item.content}</td>
                                    <td>
                                        <select
                                            value={item.status || 'pending'}
                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                            disabled={updatingId === item.id}
                                            className={`${styles.statusSelect} ${styles['status' + (item.status || 'pending')]}`}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <Loader2 className="animate-spin" size={32} />
                </div>
            </div>
        );
    }

    const roleRequests = feedbacks.filter(f => f.feedback_type === 'role_request');
    const locationRequests = feedbacks.filter(f => f.feedback_type === 'location_request');
    const generalFeedback = feedbacks.filter(f => f.feedback_type === 'general_feedback');
    const otherFeedback = feedbacks.filter(f => !['role_request', 'location_request', 'general_feedback'].includes(f.feedback_type));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>User Feedback</h1>
                <p className={styles.subtitle}>View and manage user requests</p>
            </header>

            {feedbacks.length === 0 ? (
                <div className={styles.empty}>
                    <p>No feedback received yet.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '1rem', opacity: 0.7 }}>
                        (If you see data in Supabase but not here, check your <strong>Row Level Security (RLS)</strong> policies.
                        You may need to enable "SELECT" access for the public/anon role.)
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <FeedbackTable data={roleRequests} title="Role Requests" />
                    <FeedbackTable data={locationRequests} title="Location Requests" />
                    <FeedbackTable data={generalFeedback} title="General Feedback" />
                    <FeedbackTable data={otherFeedback} title="Other Feedback" />
                </div>
            )}

            {showRLSModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }}>
                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                        maxWidth: '600px',
                        width: '100%'
                    }}>
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Permission Error</h2>
                        <p style={{ color: '#f87171', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                            {errorMessage || "Unknown permission error."}
                        </p>
                        <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            Supabase is blocking the request. If the error above mentions "policy" or "permission",
                            you need to update your <strong>Row Level Security (RLS)</strong> settings.
                        </p>

                        <div style={{
                            backgroundColor: '#0f172a',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            overflowX: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            border: '1px solid #334155'
                        }}>
                            <pre style={{ color: '#a5b4fc', margin: 0 }}>
                                {`-- The table has a CHECK constraint that only allows specific values.
-- You need to either remove it or update it to allow the new status values.

-- Option 1: Remove the constraint completely (Recommended for now)
ALTER TABLE "public"."feedback" DROP CONSTRAINT IF EXISTS "feedback_status_check";

-- Option 2: Update the constraint to allow our new values
ALTER TABLE "public"."feedback" DROP CONSTRAINT IF EXISTS "feedback_status_check";
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_status_check" 
CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed'));`}
                            </pre>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowRLSModal(false)}
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
