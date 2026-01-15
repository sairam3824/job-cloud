"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from '../companies.module.css'
import { Loader2, ArrowLeft, ExternalLink, Calendar, MapPin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface Job {
    id: string
    title: string
    location: string
    date_posted: string | null
    crawled_date: string | null
    job_url: string
    site: string
    job_level: string | null
    job_type: string | null
    role: string | null
}

export default function CompanyJobsPage() {
    const params = useParams()
    const companyName = typeof params?.companyName === 'string' ? decodeURIComponent(params.companyName) : ''

    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [sortConfig, setSortConfig] = useState<{ key: keyof Job; direction: 'asc' | 'desc' } | null>(null)

    useEffect(() => {
        if (companyName) {
            fetchJobs()
        }
    }, [companyName])

    const fetchJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('company', companyName)
                .order('crawled_date', { ascending: false })

            if (error) throw error

            // Deduplicate jobs by job_url, keeping the most recent one (since data is ordered by crawled_date desc)
            const uniqueJobs = new Map()
            data?.forEach(job => {
                if (!uniqueJobs.has(job.job_url)) {
                    uniqueJobs.set(job.job_url, job)
                }
            })

            setJobs(Array.from(uniqueJobs.values()) || [])
        } catch (error) {
            console.error('Error fetching jobs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (key: keyof Job) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const sortedJobs = [...jobs].sort((a, b) => {
        if (!sortConfig) return 0

        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === null && bValue === null) return 0
        if (aValue === null) return 1
        if (bValue === null) return -1

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
    })

    const SortIcon = ({ columnKey }: { columnKey: keyof Job }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className={styles.sortIcon} />
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className={`${styles.sortIcon} ${styles.active}`} />
            : <ArrowDown size={14} className={`${styles.sortIcon} ${styles.active}`} />
    }

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <Link href="/admin/companies" className={styles.backLink}>
                <ArrowLeft size={16} />
                Back to Companies
            </Link>

            <div className={styles.header}>
                <h1 className={styles.title}>{companyName}</h1>
                <p style={{ color: '#a1a1aa' }}>
                    {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Available
                </p>
            </div>

            {jobs.length === 0 ? (
                <div className={styles.empty}>
                    <p>No jobs found for this company.</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('title')} className={styles.sortableHeader}>
                                    <div className={styles.headerContent}>
                                        Job Title
                                        <SortIcon columnKey="title" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('role')} className={styles.sortableHeader}>
                                    <div className={styles.headerContent}>
                                        Role
                                        <SortIcon columnKey="role" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('job_level')} className={styles.sortableHeader}>
                                    <div className={styles.headerContent}>
                                        Experience
                                        <SortIcon columnKey="job_level" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('job_type')} className={styles.sortableHeader}>
                                    <div className={styles.headerContent}>
                                        Job Type
                                        <SortIcon columnKey="job_type" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('location')} className={styles.sortableHeader}>
                                    <div className={styles.headerContent}>
                                        Location
                                        <SortIcon columnKey="location" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('crawled_date')} className={styles.sortableHeader}>
                                    <div className={styles.headerContent}>
                                        Date Posted
                                        <SortIcon columnKey="crawled_date" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('site')} className={styles.sortableHeader}>
                                    <div className={styles.headerContent}>
                                        Platform
                                        <SortIcon columnKey="site" />
                                    </div>
                                </th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedJobs.map((job) => (
                                <tr key={job.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{job.title}</div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#d1d5db' }}>{job.role || '-'}</div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#9ca3af' }}>{job.job_level || '-'}</div>
                                    </td>
                                    <td>
                                        {job.job_type ? (
                                            <span className={styles.badge}>{job.job_type}</span>
                                        ) : (
                                            <span style={{ color: '#9ca3af' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={14} className="text-gray-500" />
                                            {job.location}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={14} className="text-gray-500" />
                                            {job.date_posted || job.crawled_date}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.badge}>{job.site}</span>
                                    </td>
                                    <td>
                                        <a
                                            href={job.job_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.externalLink}
                                        >
                                            View Job <ExternalLink size={14} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
