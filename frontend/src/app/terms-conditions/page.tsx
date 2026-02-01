import styles from "../page.module.css";
import Link from "next/link";

export default function TermsConditions() {
    return (
        <div className={styles.container}>
            <main className={styles.main} style={{ flexDirection: 'column', alignItems: 'flex-start', maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
                <div style={{ marginBottom: '3rem', borderBottom: '1px solid #27272a', paddingBottom: '2rem', width: '100%' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Terms and Conditions</h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>1. Agreement to Terms</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and HireMind ("we," "us" or "our"),
                            concerning your access to and use of the HireMind website. By accessing the Site, you confirm that you have read, understood, and agreed to be bound by all of these Terms and Conditions.
                            <br /><br />
                            If you do not agree with all of these terms, then you are expressly prohibited from using the Site and you must discontinue use immediately.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>2. Description of Service</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            HireMind is a job aggregation and career management platform that compiles job listings from various sources and provides tools for users to manage their job search ("Service").
                            We serve as an intermediary connecting candidates with potential opportunities but are not involved in the actual hiring process, interviews, or employment contracts.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>3. User Representations</h2>
                        <div style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            By using the Site, you represent and warrant that:
                            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li>All registration information you submit will be true, accurate, current, and complete.</li>
                                <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                                <li>You have the legal capacity and you agree to comply with these Terms of Use.</li>
                                <li>You will not access the Site through automated or non-human means, whether through a bot, script, or otherwise.</li>
                                <li>You will not use the Site for any illegal or unauthorized purpose.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>4. Intellectual Property Rights</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            Unless otherwise indicated, the Site is our proprietary property. All source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”)
                            and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                            <br /><br />
                            Job listings and company logos displayed on the site remain the property of their respective owners.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>5. Third-Party Content and Links</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            The Site may contain (or you may be sent via the Site) links to other websites ("Third-Party Websites") as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ("Third-Party Content").
                            Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us, and we are not responsible for any Third-Party Websites accessed through the Site.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>6. Disclaimer of Warranties</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            The site is provided on an "as-is" and "as-available" basis. You agree that your use of the site and our services will be at your sole risk.
                            We make no warranties or representations about the accuracy or completeness of the site’s content or the content of any websites linked to the site.
                            We do not guarantee that any employer or third party will receive your information, read your resume, interview you, or hire you.
                            <br /><br />
                            <strong>AI Services Disclaimer:</strong> Any resume scores, job matches, or career insights generated by our AI algorithms are automated estimates provided for informational purposes only.
                            They do not constitute professional career advice and are not capable of predicting actual hiring outcomes with certainty. We utilize third-party AI models which may occasionally produce inaccurate or biased results.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>7. Limitation of Liability</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site, even if we have been advised of the possibility of such damages.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#e4e4e7' }}>8. Contact Us</h2>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            To resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: <a href="mailto:support@hiremind.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>support@hiremind.com</a>.
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
