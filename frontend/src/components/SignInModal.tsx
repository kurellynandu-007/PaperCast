import { useState } from 'react';
import { X, Mail, Chrome, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignInModalProps {
    onClose: () => void;
}

export function SignInModal({ onClose }: SignInModalProps) {
    const { signInWithGoogle, signInWithMagicLink } = useAuth();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleGoogle() {
        setGoogleLoading(true);
        await signInWithGoogle();
        setGoogleLoading(false);
    }

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError(null);
        const { error } = await signInWithMagicLink(email.trim());
        setLoading(false);
        if (error) {
            setError(error);
        } else {
            setSent(true);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-[#12121A] border border-brand-border rounded-2xl shadow-2xl p-8 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {sent ? (
                    <div className="text-center space-y-4 py-4">
                        <CheckCircle2 className="w-12 h-12 text-brand-secondary mx-auto" />
                        <h2 className="text-xl font-display font-bold">Check your email</h2>
                        <p className="text-brand-muted text-sm">
                            We sent a magic link to <span className="text-brand-text font-medium">{email}</span>. Click it to sign in — no password needed.
                        </p>
                        <button onClick={onClose} className="mt-2 text-brand-primary hover:underline text-sm">Back to app</button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-display font-bold mb-2">Sign In to PaperCast</h2>
                            <p className="text-brand-muted text-sm">Save your podcasts and access them anywhere</p>
                        </div>

                        {/* Google */}
                        <button
                            onClick={handleGoogle}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl border border-brand-border hover:border-brand-muted bg-brand-bg hover:bg-[#1A1A2E] transition-all text-sm font-semibold mb-5 disabled:opacity-60"
                        >
                            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-brand-border" />
                            <span className="text-brand-muted text-xs font-mono">or email</span>
                            <div className="flex-1 h-px bg-brand-border" />
                        </div>

                        {/* Magic link */}
                        <form onSubmit={handleMagicLink} className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors"
                                    required
                                />
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="w-full py-3 rounded-xl bg-brand-primary hover:bg-[#5b54e5] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(108,99,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Send Magic Link
                            </button>
                        </form>

                        <p className="text-brand-muted text-xs text-center mt-6">
                            By signing in you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
