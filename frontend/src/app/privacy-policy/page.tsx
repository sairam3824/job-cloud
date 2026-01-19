import styles from "../page.module.css";
import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <div className={styles.container}>
            <main className={styles.main} style={{ flexDirection: 'column', alignItems: 'flex-start', maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
                <div style={{ marginBottom: '3rem', borderBottom: '1px solid #27272a', paddingBottom: '2rem', width: '100%' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Privacy Policy</h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>1. Introduction</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            Welcome to HireMind ("we," "our," or "us"). We appreciate that you trust us with your personal information and we are committed to protecting your privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our job aggregation and career management services.
                            <br /><br />
                            By accessing or using HireMind, you agree to the terms of this Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>2. Information We Collect</h2>
                        <div style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            We collect information that identifies, relates to, describes, references, is capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or device.
                            <ul style={{ listStyleType: 'none', paddingLeft: '0', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>Personal Identification Information</strong>
                                    Name, email address, phone number, and account credentials when you register.
                                </li>
                                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>Professional Data</strong>
                                    Resume/CV content, job preferences, employment history, and skills data used for our "Resume Match" features.
                                </li>
                                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>Usage Data</strong>
                                    Information on how you access and use the Service, including your IP address, browser type, pages visited, and time spent on pages.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>3. How We Use Your Information</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                            We use the information we collect to:
                        </p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Provide, operate, and maintain our website and services.</li>
                            <li>Improve, personalize, and expand our website's functionality.</li>
                            <li>Understand and analyze how you use our website to optimize matching algorithms.</li>
                            <li>Develop new products, services, features, and functionality.</li>
                            <li>Communicate with you, either directly or through one of our partners, including for customer service, updates, and marketing.</li>
                            <li>Detect and prevent fraud and abuse.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>4. Disclosure of Your Information</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            We may share information matched by our algorithms or aggregated data with potential employers or third-party job boards when you explicitly initiate an application.
                            We do not sell your personal data to third parties. We may disclose your information where required to do so by law or subpoena.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>5. Third-Party Websites</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            Our Service contains links to other websites that are not operated by us (e.g., company career pages, other job boards).
                            If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
                            We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>6. Data Security</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            We use administrative, technical, and physical security measures to help protect your personal information.
                            However, please be aware that no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>7. Contact Us</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:support@hiremind.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>support@hiremind.com</a>.
                        </p>
                    </section>
                </div>

                <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #27272a', width: '100%' }}>
                    <Link href="/" className={styles.primaryButton} style={{ display: 'inline-flex', padding: '1rem 2rem' }}>
                        &larr; Back to Home
                    </Link>
                </div>
            </main>

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
        </div>
    );
}
