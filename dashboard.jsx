/*
== React Frontend Setup Instructions ==
(Instructions from previous step are still valid)

== Firebase Integration ==
1.  Create a Firebase project at console.firebase.google.com.
2.  Create a Firestore Database in 'Test mode'.
3.  In Project Settings, create a new Web App to get your 'firebaseConfig' object.
4.  Install Firebase in your terminal: `npm install firebase`
5.  Paste your 'firebaseConfig' object into the placeholder below.
*/

import React, { useState, useEffect } from 'react';
// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";


// --- IMPORTANT: YOUR FIREBASE CONFIGURATION IS NOW ADDED ---
const firebaseConfig = {
    apiKey: "AIzaSyDMCYq4fbFiM8zaJIUKALP-aYmBXz_U-as",
    authDomain: "credit-risk-app-8c335.firebaseapp.com",
    projectId: "credit-risk-app-8c335",
    storageBucket: "credit-risk-app-8c335.appspot.com",
    messagingSenderId: "973334575069",
    appId: "1:973334575069:web:fa30ea71e7fdf0c9d0a834",
    measurementId: "G-QBEQ8N9R73"
};
// ---------------------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// Main App Component
export default function App() {
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
        };

        try {
            const response = await fetch('http://127.0.0.1:5001/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            setResult(data);

            // ** NEW: Save prediction to Firebase **
            await addDoc(collection(db, "predictions"), {
                ...apiPayload,
                default_probability: data.default_probability,
                createdAt: new Date()
            });

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Check the console and make sure your API server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <Header />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <InputForm formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} loading={loading} />
                    </div>
                    <div className="lg:col-span-2">
                        <ResultsDisplay loading={loading} result={result} />
                        <PredictionHistory />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ** NEW: Prediction History Component **
const PredictionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This query gets the 'predictions' and orders them by creation date, newest first.
        const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"));

        // onSnapshot creates a real-time listener.
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const predictions = [];
            querySnapshot.forEach((doc) => {
                predictions.push({ id: doc.id, ...doc.data() });
            });
            setHistory(predictions);
            setLoading(false);
        });

        // This function runs when the component is removed from the screen to prevent memory leaks.
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Prediction History</h2>
            {loading ? <p>Loading history...</p> : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {history.length === 0 ? <p className="text-gray-500">No predictions made yet.</p> : history.map(item => (
                        <HistoryItem key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

const HistoryItem = ({ item }) => {
    const probability = item.default_probability * 100;
    let riskColor = '';
    if (probability < 20) riskColor = 'text-green-600';
    else if (probability < 50) riskColor = 'text-yellow-600';
    else riskColor = 'text-red-600';

    return(
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 grid grid-cols-3 gap-4 items-center">
            <div>
                <p className="font-semibold text-gray-800">Loan: ${item.loan_amnt.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{item.createdAt.toDate().toLocaleDateString()}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-gray-500">Income: ${item.annual_inc.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Purpose: {item.purpose.replace(/_/g, ' ')}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold text-lg ${riskColor}`}>{probability.toFixed(2)}%</p>
                <p className="text-sm text-gray-500">Risk</p>
            </div>
        </div>
    )
}


// --- (Other components like Header, InputForm, etc. remain largely the same) ---
// ... [Header Component code is here]
// ... [InputForm Component code is here]
// ... [InputField/SelectField Component code is here]
// ... [ResultsDisplay Component code is here]
// ... [LoadingSpinner Component code is here]
// ... [ShapChart Component code is here]
const Header = () => (
    <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Credit Risk Scoring System</h1>
        <p className="text-gray-600 mt-2">Enter applicant data to predict loan default probability (React Version).</p>
    </header>
);

const InputForm = ({ formData, handleInputChange, handleSubmit, loading }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Applicant Information</h2>
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField id="loan_amnt" label="Loan Amount ($)" type="number" value={formData.loan_amnt} onChange={handleInputChange} />
                <InputField id="int_rate" label="Interest Rate (%)" type="number" step="0.01" value={formData.int_rate} onChange={handleInputChange} />
                <InputField id="annual_inc" label="Annual Income ($)" type="number" value={formData.annual_inc} onChange={handleInputChange} />
                <InputField id="emp_length" label="Employment Length (Years)" type="number" value={formData.emp_length} onChange={handleInputChange} />
                <SelectField id="term" label="Loan Term" value={formData.term} onChange={handleInputChange} options={[' 36 months', ' 60 months']} />
                <SelectField id="grade" label="Loan Grade" value={formData.grade} onChange={handleInputChange} options={['A', 'B', 'C', 'D', 'E', 'F', 'G']} />
                <SelectField id="home_ownership" label="Home Ownership" value={formData.home_ownership} onChange={handleInputChange} options={['RENT', 'MORTGAGE', 'OWN', 'ANY']} />
                <SelectField id="purpose" label="Loan Purpose" value={formData.purpose} onChange={handleInputChange} options={['debt_consolidation', 'credit_card', 'home_improvement', 'other']} />
            </div>
            <div className="mt-8 text-center">
                <button type="submit" disabled={loading} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full md:w-auto disabled:bg-indigo-300">
                    {loading ? 'Analyzing...' : 'Predict Default Risk'}
                </button>
            </div>
        </form>
    </div>
);

const InputField = ({ id, label, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input id={id} {...props} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
    </div>
);

const SelectField = ({ id, label, options, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <select id={id} {...props} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            {options.map(opt => <option key={opt} value={opt}>{opt.trim().replace(/_/g, ' ')}</option>)}
        </select>
    </div>
);

const ResultsDisplay = ({ loading, result }) => {
    if (loading) return <LoadingSpinner />;
    if (!result) return (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center min-h-[300px]">
            <p className="text-gray-500">Prediction results will appear here.</p>
        </div>
    );
    const probability = result.default_probability * 100;
    let riskLevel = '';
    let riskColor = '';
    if (probability < 20) {
        riskLevel = 'Low Risk';
        riskColor = 'text-green-600';
    } else if (probability < 50) {
        riskLevel = 'Medium Risk';
        riskColor = 'text-yellow-600';
    } else {
        riskLevel = 'High Risk';
        riskColor = 'text-red-600';
    }
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Prediction Results</h2>
            <div className="text-center mb-6">
                <p className="text-lg text-gray-600">Predicted Default Probability</p>
                <p className={`text-5xl font-bold mt-2 ${riskColor}`}>{probability.toFixed(2)}%</p>
                <p className="text-xl font-medium mt-2 text-gray-800">{riskLevel}</p>
            </div>
            <ShapChart explanation={result.explanation} />
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">Analyzing applicant data...</p>
        </div>
    </div>
);

const ShapChart = ({ explanation }) => {
    const features = Object.keys(explanation);
    const shapValues = Object.values(explanation);
    const sortedFeatures = features.map((feature, i) => ({
        name: feature,
        value: shapValues[i]
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10);

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Key Factors Influencing Prediction</h3>
            <p className="text-sm text-gray-500 mb-4">Features pushing towards "Default" (Red) or "Good Loan" (Green).</p>
            <ul className="space-y-2">
                {sortedFeatures.map(f => (
                    <li key={f.name} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{f.name.replace(/_/g, ' ')}</span>
                        <span className={`font-medium ${f.value > 0 ? 'text-red-500' : 'text-green-500'}`}>
                           {f.value > 0 ? '+' : ''}{f.value.toFixed(3)} {f.value > 0 ? ' (Increases Risk)' : ' (Decreases Risk)'}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
};
