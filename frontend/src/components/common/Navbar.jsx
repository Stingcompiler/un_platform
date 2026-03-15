import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, GraduationCap, LogOut, LayoutDashboard } from 'lucide-react';
import college_logo from '../../assets/college_logo.png';
export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const { isAuthenticated, logout, user } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/', label: t('nav.home') },
        { path: '/about', label: t('nav.about') },
        { path: '/departments', label: t('nav.departments') },
        { path: '/events', label: t('nav.events') },
        { path: '/contact', label: t('nav.contact') },
    ];

    const handleLogout = async () => {
        await logout();
        setIsOpen(false);
    };

    return (
        <nav className="fixed top-0 right-0 left-0 z-50 glass-card border-0 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                            <img src={college_logo} alt="College Logo" className="w-12 h-12" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold gradient-text">كلية الامارات   </h1>
                            <p className="text-xs text-[var(--color-text-muted)]">للعلوم والتكنولوجيا</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden lg:flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="btn-primary py-2 px-4">
                                    <LayoutDashboard className="w-4 h-4" />
                                    {t('nav.dashboard')}
                                </Link>
                                <button onClick={handleLogout} className="nav-link flex items-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    {t('nav.logout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link">
                                    {t('nav.login')}
                                </Link>
                                <Link to="/register" className="btn-accent py-2 px-4">
                                    {t('nav.register')}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="lg:hidden p-2 text-[var(--color-text)]"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden glass-card border-t border-white/10 py-4 px-4">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`nav-link text-lg ${isActive(link.path) ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="btn-primary justify-center">
                                        <LayoutDashboard className="w-4 h-4" />
                                        {t('nav.dashboard')}
                                    </Link>
                                    <button onClick={handleLogout} className="btn-accent justify-center">
                                        <LogOut className="w-4 h-4" />
                                        {t('nav.logout')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="btn-primary justify-center">
                                        {t('nav.login')}
                                    </Link>
                                    <Link to="/register" onClick={() => setIsOpen(false)} className="btn-accent justify-center">
                                        {t('nav.register')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
