import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign, Percent, Calendar, Home, Target, Sparkles, Zap, User, Lock, Mail, LogOut } from 'lucide-react';

// --- Firebase Configuration (No changes needed here) ---
const firebaseConfig = {
    apiKey: "AIzaSyDMCYq4fbFiM8zaJIUKALP-aYmBXz_U-as",
    authDomain: "credit-risk-app-8c335.firebaseapp.com",
    projectId: "credit-risk-app-8c335",
    storageBucket: "credit-risk-app-8c335.appspot.com",
    messagingSenderId: "973334575069",
    appId: "1:973334575069:web:fa30ea71e7fdf0c9d0a834",
    measurementId: "G-QBEQ8N9R73"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Main Application Entry Point ---
export default function AuthController() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This is the core of Firebase Auth: a listener that checks if the user is logged in.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <AuthLoadingScreen />; // Show a loading screen while checking auth status
    }

    // Conditional Rendering: If a user is logged in, show the main App. Otherwise, show the AuthScreen.
    return user ? <App user={user} /> : <AuthScreen />;
}


// --- Main App Component (Now receives user prop) ---
function App({ user }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState({
        loan_amnt: 10000,
        int_rate: 11.5,
        annual_inc: 75000,
        emp_length: 5,
        term: ' 36 months',
        grade: 'B',
        home_ownership: 'MORTGAGE',
        purpose: 'debt_consolidation',
    });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const apiPayload = {
            ...formData,
            loan_amnt: parseFloat(formData.loan_amnt),
            int_rate: parseFloat(formData.int_rate),
            annual_inc: parseFloat(formData.annual_inc),
            emp_length: parseFloat(formData.emp_length),
            dti: 20.0, fico_range_low: 690, fico_range_high: 694, open_acc: 10, pub_rec: 0, revol_bal: 15000, revol_util: 50.0, total_acc: 25,
            issue_d: 'Dec-2015', earliest_cr_line: 'Jan-2005'
        };

        try {
            const response = await fetch('http://127.0.0.1:5001/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setResult(data);

            // ** MODIFIED: Save prediction with userId **
            await addDoc(collection(db, "predictions"), {
                ...apiPayload,
                userId: user.uid, // Tie the prediction to the logged-in user
                default_probability: data.default_probability,
                createdAt: new Date()
            });

        } catch (error) {
            console.error('Fetch Error:', error);
            alert('An error occurred. Check the browser console for more details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white font-sans relative overflow-hidden flex items-center justify-center">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-40 right-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-float-delay-1"></div>
                <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl animate-float-delay-2"></div>
                <div className="absolute bottom-32 right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-float-delay-3"></div>
            </div>

            <div className="absolute top-4 right-4 z-20">
                <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-md border border-blue-300/20 rounded-lg text-slate-300 hover:text-white hover:border-amber-300/30 transition-all">
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>


            <div className="relative w-full px-4 py-12">
                <div className="flex flex-col items-center">
                    <Header />
                    <div className="w-full max-w-7xl mt-12">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 flex justify-center">
                                <div className="w-full max-w-md">
                                    <InputForm formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} loading={loading} />
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-8">
                                <ResultsDisplay loading={loading} result={result} />
                                <PredictionHistory user={user} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- NEW: Authentication Screen Component ---
const AuthScreen = () => {
    const [view, setView] = useState('login'); // 'login', 'signup', or 'forgot'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white font-sans relative overflow-hidden flex items-center justify-center p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-40 right-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-float-delay-1"></div>
            </div>
            <div className="relative w-full max-w-md">
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-300/20 p-8 text-center">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-blue-300 via-amber-200 to-blue-400 bg-clip-text text-transparent mb-2">
                        {view === 'forgot' ? 'Reset Password' : 'Welcome'}
                    </h1>
                    <p className="text-slate-300 mb-8">
                        {view === 'login' && 'Sign in to access your dashboard'}
                        {view === 'signup' && 'Create an account to get started'}
                        {view === 'forgot' && 'Recover your account'}
                    </p>

                    {view === 'login' && <LoginForm onForgotPassword={() => setView('forgot')} />}
                    {view === 'signup' && <SignUpForm />}
                    {view === 'forgot' && <ForgotPasswordForm onBack={() => setView('login')} />}

                    {view !== 'forgot' && (
                        <button
                            onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                            className="mt-6 text-sm text-slate-400 hover:text-amber-300 transition"
                        >
                            {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const LoginForm = ({ onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
            <AuthInputField type="email" placeholder="Email" icon={<Mail size={18}/>} value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthInputField type="password" placeholder="Password" icon={<Lock size={18}/>} value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-amber-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition-transform">
                Sign In
            </button>
            <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-slate-400 hover:text-amber-300 transition"
            >
                Forgot Password?
            </button>
        </form>
    );
};

const SignUpForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSignUp} className="space-y-6">
            <AuthInputField type="email" placeholder="Email" icon={<Mail size={18}/>} value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthInputField type="password" placeholder="Password" icon={<Lock size={18}/>} value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition-transform">Sign Up</button>
        </form>
    );
};

const AuthInputField = ({ icon, type, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
            <input
                {...props}
                type={isPassword && showPassword ? 'text' : type}
                className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-blue-400/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                required
            />
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
            )}
        </div>
    );
};

// --- MODIFIED: PredictionHistory now receives user prop ---
const PredictionHistory = ({ user }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return; // Don't fetch if there's no user

        // ** MODIFIED: Query is now filtered by userId **
        const q = query(
            collection(db, "predictions"),
            where("userId", "==", user.uid), // Only get predictions for the current user
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const predictions = [];
            querySnapshot.forEach((doc) => {
                predictions.push({ id: doc.id, ...doc.data() });
            });
            setHistory(predictions);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]); // Rerun this effect if the user changes

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-300/20 p-8 animate-slide-up-delay">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
                <Clock className="text-amber-300" />
                Your Prediction History
            </h2>
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {history.length === 0 ? (
                        <p className="text-slate-400 text-center py-12">No predictions made yet.</p>
                    ) : history.map(item => <HistoryItem key={item.id} item={item} />)}
                </div>
            )}
        </div>
    );
};

const AuthLoadingScreen = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
    </div>
);


// --- All other components (Header, InputForm, etc.) are unchanged and encapsulated here ---
const Header = () => (
    <header className="text-center space-y-6 animate-fade-in">
        <div className="inline-block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-amber-300 blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-500/20 to-amber-400/20 backdrop-blur-xl border border-blue-300/30 p-1 rounded-3xl shadow-2xl">
                <div className="bg-slate-900/80 backdrop-blur-md px-12 py-6 rounded-3xl">
                    <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-300 via-amber-200 to-blue-400 bg-clip-text text-transparent tracking-tight">
                        Credit Risk AI
                    </h1>
                </div>
            </div>
        </div>
        <div className="flex items-center justify-center gap-2">
            <Sparkles className="text-amber-300 animate-pulse" size={20} />
            <p className="text-slate-300 text-lg font-medium tracking-wide">
                Advanced Machine Learning Credit Analysis
            </p>
            <Sparkles className="text-blue-300 animate-pulse" size={20} />
        </div>
    </header>
);

const InputForm = ({ formData, handleInputChange, handleSubmit, loading }) => (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-300/20 p-8 hover:border-amber-300/30 transition-all duration-500 hover:shadow-amber-300/10 animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Target className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Application Details</h2>
        </div>
        <div className="space-y-6">
            <InputField id="loan_amnt" label="Loan Amount" icon={<DollarSign size={18} />} type="number" value={formData.loan_amnt} onChange={handleInputChange} />
            <InputField id="int_rate" label="Interest Rate" icon={<Percent size={18} />} type="number" step="0.01" value={formData.int_rate} onChange={handleInputChange} />
            <InputField id="annual_inc" label="Annual Income" icon={<DollarSign size={18} />} type="number" value={formData.annual_inc} onChange={handleInputChange} />
            <InputField id="emp_length" label="Employment Years" icon={<Clock size={18} />} type="number" value={formData.emp_length} onChange={handleInputChange} />
            <SelectField id="term" label="Loan Term" icon={<Calendar size={18} />} value={formData.term} onChange={handleInputChange} options={[' 36 months', ' 60 months']} />
            <SelectField id="grade" label="Credit Grade" value={formData.grade} onChange={handleInputChange} options={['A', 'B', 'C', 'D', 'E', 'F', 'G']} />
            <SelectField id="home_ownership" label="Home Status" icon={<Home size={18} />} value={formData.home_ownership} onChange={handleInputChange} options={['RENT', 'MORTGAGE', 'OWN', 'ANY']} />
            <SelectField id="purpose" label="Purpose" value={formData.purpose} onChange={handleInputChange} options={['debt_consolidation', 'credit_card', 'home_improvement', 'other']} />
            <button
                onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                disabled={loading}
                className="w-full mt-8 relative overflow-hidden group bg-gradient-to-r from-blue-600 via-blue-500 to-amber-400 hover:from-blue-500 hover:via-amber-400 hover:to-blue-600 text-white font-bold py-5 px-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <Zap size={22} />
                            <span>Calculate Risk Score</span>
                        </>
                    )}
                </span>
            </button>
        </div>
    </div>
);

const InputField = ({ id, label, icon, ...props }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
            {icon && <span className="text-amber-300">{icon}</span>}
            {label}
        </label>
        <input
            id={id}
            {...props}
            className="w-full px-4 py-3.5 bg-slate-800/50 border border-blue-400/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 backdrop-blur-sm hover:bg-slate-800/70"
            required
        />
    </div>
);

const SelectField = ({ id, label, icon, options, ...props }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
            {icon && <span className="text-amber-300">{icon}</span>}
            {label}
        </label>
        <select
            id={id}
            {...props}
            className="w-full px-4 py-3.5 bg-slate-800/50 border border-blue-400/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-300 backdrop-blur-sm cursor-pointer hover:bg-slate-800/70"
        >
            {options.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt.trim().replace(/_/g, ' ')}</option>)}
        </select>
    </div>
);

const ResultsDisplay = ({ loading, result }) => {
    if (loading) return <LoadingSpinner />;
    if (!result) return (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-300/20 p-16 flex items-center justify-center min-h-[500px] animate-fade-in">
            <div className="text-center space-y-6 animate-pulse">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-400 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/30">
                    <TrendingUp size={48} className="text-white" />
                </div>
                <p className="text-slate-300 text-xl font-medium">Submit application to view risk analysis</p>
            </div>
        </div>
    );

    const probability = result.default_probability * 100;
    let riskLevel = '', riskColor = '', RiskIcon = AlertCircle;

    if (probability < 20) {
        riskLevel = 'Low Risk'; riskColor = 'from-emerald-400 to-green-500'; RiskIcon = CheckCircle;
    } else if (probability < 50) {
        riskLevel = 'Medium Risk'; riskColor = 'from-amber-400 to-orange-500'; RiskIcon = AlertCircle;
    } else {
        riskLevel = 'High Risk'; riskColor = 'from-red-400 to-rose-500'; RiskIcon = AlertCircle;
    }

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-300/20 p-10 animate-slide-up">
            <h2 className="text-3xl font-bold text-slate-100 mb-8 flex items-center gap-3">
                <Sparkles className="text-amber-300" />
                Risk Analysis
            </h2>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-10 mb-10 border border-blue-400/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl"></div>
                <p className="text-slate-400 text-sm mb-3 font-medium">Default Probability</p>
                <div className={`text-7xl font-black bg-gradient-to-r ${riskColor} bg-clip-text text-transparent mb-6 tracking-tight`}>
                    {probability.toFixed(2)}%
                </div>
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${riskColor} text-white font-bold text-lg shadow-xl`}>
                    <RiskIcon size={24} />
                    {riskLevel}
                </div>
            </div>

            <ShapChart explanation={result.explanation} />
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-300/20 p-16 flex items-center justify-center min-h-[500px] animate-fade-in">
        <div className="text-center space-y-8">
            <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 border-8 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-8 border-transparent border-t-amber-400 rounded-full animate-spin" style={{animationDuration: '1.5s', animationDirection: 'reverse'}}></div>
            </div>
            <div className="space-y-3">
                <p className="text-white text-2xl font-bold">Analyzing Application</p>
                <p className="text-slate-400 text-lg">Processing ML model predictions...</p>
            </div>
        </div>
    </div>
);

const ShapChart = ({ explanation }) => {
    const features = Object.keys(explanation);
    const shapValues = Object.values(explanation);
    const sortedFeatures = features.map((feature, i) => ({
        name: feature, value: shapValues[i]
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10);

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <TrendingUp className="text-blue-400" />
                Key Risk Factors
            </h3>
            <p className="text-slate-400">AI-powered feature importance</p>

            <div className="space-y-4">
                {sortedFeatures.map((f) => {
                    const isPositive = f.value > 0;
                    const percentage = (Math.abs(f.value) / Math.max(...sortedFeatures.map(x => Math.abs(x.value)))) * 100;

                    return (
                        <div key={f.name} className="bg-slate-800/40 rounded-xl p-5 border border-blue-400/10 hover:bg-slate-800/60 hover:border-amber-400/20 transition-all duration-300 group">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-200 font-semibold">{f.name.replace(/_/g, ' ')}</span>
                                <div className="flex items-center gap-2">
                                    {isPositive ? <TrendingUp size={18} className="text-red-400" /> : <TrendingDown size={18} className="text-emerald-400" />}
                                    <span className={`font-bold text-lg ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {f.value > 0 ? '+' : ''}{f.value.toFixed(3)}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${isPositive ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const HistoryItem = ({ item }) => {
    const probability = item.default_probability * 100;
    let riskColor = '', riskBg = '';

    if (probability < 20) { riskColor = 'text-emerald-400'; riskBg = 'bg-emerald-500/20'; }
    else if (probability < 50) { riskColor = 'text-amber-400'; riskBg = 'bg-amber-500/20'; }
    else { riskColor = 'text-red-400'; riskBg = 'bg-red-500/20'; }

    return (
        <div className="bg-slate-800/40 border border-blue-400/10 rounded-xl p-5 hover:bg-slate-800/60 hover:border-amber-400/20 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="font-bold text-slate-100 flex items-center gap-2 text-lg">
                        <DollarSign size={18} className="text-amber-300" />
                        ${item.loan_amnt.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400">{item.createdAt.toDate().toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">{item.purpose.replace(/_/g, ' ')}</p>
                </div>
                <div className={`${riskBg} ${riskColor} px-5 py-2 rounded-xl font-bold text-xl group-hover:scale-110 transition-transform`}>
                    {probability.toFixed(1)}%
                </div>
            </div>
        </div>
    );
};

const ForgotPasswordForm = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent! Check your inbox.');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleResetPassword} className="space-y-6">
            <p className="text-slate-300 text-sm">Enter your email to receive a password reset link</p>
            <AuthInputField
                type="email"
                placeholder="Email"
                icon={<Mail size={18}/>}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-emerald-400 text-sm">{message}</p>}
            <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-amber-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
                Send Reset Link
            </button>
            <button
                type="button"
                onClick={onBack}
                className="w-full text-slate-400 hover:text-amber-300 transition text-sm"
            >
                Back to Sign In
            </button>
        </form>
    );
};
