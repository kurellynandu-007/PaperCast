import { useState } from 'react';
import { Mic, Sparkles, User, LogOut, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignInModal } from './SignInModal';

export function Navbar() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [showSignIn, setShowSignIn] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    const displayName = (user?.user_metadata?.full_name as string | undefined)
        ?? user?.email?.split('@')[0]
        ?? 'Account';

    function navCls(path: string) {
        const active = location.pathname === path;
        return `flex items-center gap-1.5 font-medium text-sm transition-colors ${active ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-primary'}`;
    }

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center group-hover:bg-brand-primary/30 transition-colors">
                            <Mic className="text-brand-primary w-5 h-5" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight">PaperCast</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-6">
                        <Link to="/debate-score" className={navCls('/debate-score')}>
                            <BarChart3 className="w-4 h-4" />
                            Debate Score
                        </Link>
                        <Link to="/transformations" className={navCls('/transformations')}>
                            <Sparkles className="w-4 h-4" />
                            Transformations
                        </Link>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(v => !v)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border hover:border-brand-primary transition-colors bg-brand-card"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 text-brand-muted" />
                                    )}
                                    <span className="text-sm font-medium text-brand-text max-w-[120px] truncate">{displayName}</span>
                                </button>
                                {showUserMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#12121A] border border-brand-border rounded-xl shadow-xl overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-brand-border">
                                            <p className="text-xs text-brand-muted truncate">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { signOut(); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-brand-muted hover:text-red-400 hover:bg-red-400/5 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSignIn(true)}
                                className="px-4 py-2 rounded-full border border-brand-border hover:border-brand-primary text-brand-muted hover:text-brand-primary text-sm font-medium transition-colors"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
        </>
    );
}
