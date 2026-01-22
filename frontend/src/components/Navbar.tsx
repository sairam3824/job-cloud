"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
    Briefcase,
    Menu,
    X,
    LogOut,
    User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./Navbar.module.css";

// Lazy load FeedbackWidget - not needed for initial page render
const FeedbackWidget = dynamic(() => import("@/components/FeedbackWidget"), {
    ssr: false,
    loading: () => <span style={{ color: '#a1a1aa' }}>Feedback</span>
});

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();

    // UI State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);


    // Refs for clicking outside
    const profileRef = useRef<HTMLDivElement>(null);


    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    // Hide Navbar on Admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    const handleSignOut = async () => {
        await signOut();
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
        router.push('/');
    };

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.navContainer}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <Briefcase size={24} color="#60a5fa" />
                        <span>HireMind</span>
                    </Link>

                    {/* Mobile Toggle */}
                    <button
                        className={styles.mobileMenuToggle}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Desktop Navigation */}
                    <div className={styles.navLinks}>
                        <Link
                            href="/"
                            className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
                        >
                            Resume Match
                        </Link>
                        <Link
                            href="/jobs"
                            className={`${styles.navLink} ${isActive("/jobs") ? styles.active : ""}`}
                        >
                            Jobs
                        </Link>
                        <Link
                            href="/companies"
                            className={`${styles.navLink} ${isActive("/companies") ? styles.active : ""}`}
                        >
                            Companies
                        </Link>

                        {/* Saved Links (Only if logged in) */}
                        {user && (
                            <>
                                <Link
                                    href="/saved-jobs"
                                    className={`${styles.navLink} ${isActive("/saved-jobs") ? styles.active : ""}`}
                                >
                                    Saved Jobs
                                </Link>
                                <Link
                                    href="/saved-companies"
                                    className={`${styles.navLink} ${isActive("/saved-companies") ? styles.active : ""}`}
                                >
                                    Saved Companies
                                </Link>
                            </>
                        )}

                        {/* Feedback Widget treated as a Nav Link */}
                        <div className={styles.feedbackLink}>
                            <FeedbackWidget />
                        </div>
                    </div>

                    {/* Right Side Actions - Profile / Auth Only */}
                    <div className={styles.rightActions}>
                        {user ? (
                            <div
                                className={styles.profileWrapper}
                                ref={profileRef}
                                style={{ position: 'relative' }}
                            >
                                <button
                                    className={`${styles.userMenuTrigger} ${isProfileOpen ? styles.open : ''}`}
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    title="Account Menu"
                                >
                                    <User size={20} />
                                </button>

                                {isProfileOpen && (
                                    <div className={styles.dropdownMenu}>
                                        <div className={styles.userInfo}>
                                            <small>Signed in as</small>
                                            <strong>{user.email}</strong>
                                        </div>

                                        <Link
                                            href="/profile"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <User size={16} /> My Profile
                                        </Link>

                                        <Link
                                            href="/applied-jobs"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <Briefcase size={16} /> Applied Jobs
                                        </Link>

                                        <div className={styles.dropdownDivider} />

                                        <button
                                            onClick={handleSignOut}
                                            className={`${styles.dropdownItem} ${styles.danger}`}
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.authButtons}>
                                <Link href="/login" className={styles.loginLink}>
                                    Login
                                </Link>
                                <Link href="/signup" className={styles.signupButton}>
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className={styles.mobileMenu}>
                        <Link
                            href="/"
                            className={`${styles.mobileLink} ${isActive("/") ? styles.active : ""}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Resume Match
                        </Link>
                        <Link
                            href="/jobs"
                            className={`${styles.mobileLink} ${isActive("/jobs") ? styles.active : ""}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Jobs
                        </Link>
                        <Link
                            href="/companies"
                            className={`${styles.mobileLink} ${isActive("/companies") ? styles.active : ""}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Companies
                        </Link>

                        {user && (
                            <>
                                <Link
                                    href="/saved-jobs"
                                    className={`${styles.mobileLink} ${isActive("/saved-jobs") ? styles.active : ""}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Saved Jobs
                                </Link>
                                <Link
                                    href="/saved-companies"
                                    className={`${styles.mobileLink} ${isActive("/saved-companies") ? styles.active : ""}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Saved Companies
                                </Link>
                                <Link
                                    href="/applied-jobs"
                                    className={`${styles.mobileLink} ${isActive("/applied-jobs") ? styles.active : ""}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Applied Jobs
                                </Link>
                            </>
                        )}

                        <div style={{ padding: '1rem 0' }}>
                            <FeedbackWidget />
                        </div>

                        {user ? (
                            <div className={styles.mobileAuth}>
                                <Link
                                    href="/profile"
                                    className={styles.mobileLink}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    My Profile ({user.email?.split('@')[0]})
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className={styles.logoutBtnMobile}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className={styles.mobileAuth}>
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{ textAlign: 'center', width: '100%', display: 'block', padding: '1rem', color: 'white', fontWeight: 600 }}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{ textAlign: 'center', width: '100%', display: 'block', padding: '1rem', background: 'white', color: 'black', borderRadius: '12px', fontWeight: 600 }}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>
            {!pathname?.startsWith('/jobs') && <div className={styles.navSpacer} />}
        </>
    );
}
