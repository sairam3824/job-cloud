"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    MessageSquare,
    Building2,
    Users,
    ShieldAlert,
    LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./AdminNavbar.module.css";

export default function AdminNavbar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const isActive = (path: string) => {
        if (path === "/admin" && pathname === "/admin") return true;
        if (path !== "/admin" && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                {/* Logo */}
                <Link href="/admin" className={styles.logo}>
                    <ShieldAlert size={24} className="text-red-500" />
                    <span>Admin Console</span>
                </Link>

                {/* Navigation Links */}
                <div className={styles.navLinks}>
                    <Link
                        href="/"
                        className={styles.navLink}
                    >
                        <Home size={18} />
                        <span>Home</span>
                    </Link>

                    <Link
                        href="/admin/feedback"
                        className={`${styles.navLink} ${isActive("/admin/feedback") ? styles.navLinkActive : ""}`}
                    >
                        <MessageSquare size={18} />
                        <span>Feedback</span>
                    </Link>

                    <Link
                        href="/admin/companies"
                        className={`${styles.navLink} ${isActive("/admin/companies") ? styles.navLinkActive : ""}`}
                    >
                        <Building2 size={18} />
                        <span>Companies</span>
                    </Link>

                    <Link
                        href="/admin/users"
                        className={`${styles.navLink} ${isActive("/admin/users") ? styles.navLinkActive : ""}`}
                    >
                        <Users size={18} />
                        <span>Users</span>
                    </Link>
                </div>

                {/* Right Side Actions */}
                <div className={styles.rightActions}>
                    {user && (
                        <span className={styles.userEmail}>
                            {user.email}
                        </span>
                    )}

                    <button
                        onClick={() => signOut()}
                        className={styles.logoutBtn}
                        title="Sign Out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
