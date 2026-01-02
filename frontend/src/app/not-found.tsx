import Link from "next/link";
import styles from "./not-found.module.css";
import pageStyles from "./page.module.css"; // Reuse footer styles
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.bgCircle} style={{ top: '10%', left: '30%', background: '#2563eb' }}></div>
            <div className={styles.bgCircle} style={{ bottom: '10%', right: '10%', background: '#7c3aed' }}></div>

            <div className={styles.content}>
                <div className={styles.illustration}>
                    <SearchX size={64} className={styles.icon} />
                </div>

                <div className={styles.glitchWrapper}>
                    <h1 className={styles.errorCode}>404</h1>
                </div>

                <h2 className={styles.title}>Page Not Found</h2>

                <p className={styles.description}>
                    Oops! The page you are looking for seems to have wandered off.
                    It might be a remote position that's hard to track down.
                </p>

                <Link href="/" className={styles.homeButton}>
                    <Home size={20} />
                    Back to Home
                </Link>
            </div>

            <footer className={pageStyles.footer} style={{ width: '100%', marginTop: 'auto' }}>
                <div className={pageStyles.footerContent}>
                    <div className={pageStyles.capstone}>
                        Developed as a Capstone Project
                    </div>

                    <div className={pageStyles.centerBlock}>
                        <div className={pageStyles.copy}>
                            &copy; {new Date().getFullYear()} Job Cloud. All rights reserved.
                        </div>
                    </div>

                    <div className={pageStyles.footerLinks}>
                        <Link href="/privacy-policy">Privacy Policy</Link>
                        <Link href="/terms-conditions">Terms & Conditions</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
