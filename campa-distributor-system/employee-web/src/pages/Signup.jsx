import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { User, Mail, Lock, Briefcase, ArrowRight, Loader } from 'lucide-react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('sales_rep');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const response = await axios.post('/auth/register', {
                name,
                email,
                password,
                role
            });

            // Auto login after signup
            login(response.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[100px]"></div>
                <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]"></div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 z-10 mx-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-slate-400">Join the team today</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 mb-6 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all font-medium"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all font-medium"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Briefcase className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <select
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all font-medium appearance-none cursor-pointer"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="sales_rep" className="bg-slate-900 text-white">Sales Representative</option>
                                <option value="driver" className="bg-slate-900 text-white">Driver</option>
                                <option value="collection_agent" className="bg-slate-900 text-white">Collection Agent</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-95 hover:shadow-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : (
                            <>
                                Create Account <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-400">
                        Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
