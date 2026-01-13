"use client"

import Link from 'next/link'
import { MessageSquare, Lock } from 'lucide-react'
import styles from './admin.module.css'

export default function AdminPage() {
    return (
        <div className={styles.grid}>
            <Link
                href="/admin/feedback"
                className={styles.card}
            >
                <div className={styles.cardIcon}>
                    <MessageSquare size={24} color="#2563eb" />
                </div>
                <h2 className={styles.cardTitle}>Feedback</h2>
                <p className={styles.cardDesc}>View user feedback, role requests, and location requests.</p>
            </Link>

            <div className={`${styles.card} ${styles.cardDisabled}`}>
                <div className={`${styles.cardIcon} ${styles.cardIconDisabled}`}>
                    <Lock size={24} color="#4b5563" />
                </div>
                <h2 className={`${styles.cardTitle}`} style={{ color: '#6b7280' }}>Analytics</h2>
                <p className={`${styles.cardDesc} style={{color: '#4b5563'}}`}>Coming soon.</p>
            </div>
        </div>
    )
}
