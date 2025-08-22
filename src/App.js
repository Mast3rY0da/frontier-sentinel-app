import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, serverTimestamp, setDoc, query, where } from "firebase/firestore";
import {
  User,
  Shield,
  AlertTriangle,
  CheckSquare,
  FileText,
  Users,
  Calendar,
  Plus,
  Settings,
  LogOut,
  Clock,
  TrendingUp,
  Activity,
  Loader2,
  MapPin,
  Camera,
  Eye,
  ArrowLeft,
  Download,
  CheckCircle,
  Sparkles
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBtKJZ880vy-n_-VJhXiW5G58HjO07-NtE",
  authDomain: "frontier-sentinel-aec47.firebaseapp.com",
  projectId: "frontier-sentinel-aec47",
  storageBucket: "frontier-sentinel-aec47.appspot.com",
  messagingSenderId: "211930423770",
  appId: "1:211930423770:web:3dbaebcc8f377ccc94a0e3",
  measurementId: "G-Y7EK8Z6X3V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Authentication Hook (useAuth) ---
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          const newUser = { displayName: user.email, role: 'user', email: user.email };
          await setDoc(userDocRef, newUser);
          setUserData(newUser);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);

  return { user, userData, loading, signIn, signOut };
};

// --- Reusable Components ---
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-slate-100">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
      <p className="mt-4 text-lg font-medium text-slate-700">Loading...</p>
    </div>
  </div>
);

const statusColor = (status) => {
  switch (status) {
    case 'High': case 'Critical': case 'Overdue': case 'Expired':
      return 'bg-red-100 text-red-800';
    case 'Medium': case 'Investigating':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low': case 'Current':
      return 'bg-green-100 text-green-800';
    case 'Open': case 'Scheduled':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// --- Page/View Components ---

const Dashboard = () => {
    const [data, setData] = useState({ hazardIds: [], inspections: [], training: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const [hazardSnapshot, inspectionSnapshot, trainingSnapshot] = await Promise.all([
            getDocs(collection(db, 'hazardIds')),
            getDocs(collection(db, 'inspections')),
            getDocs(collection(db, 'training'))
          ]);
          setData({
            hazardIds: hazardSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
            inspections: inspectionSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
            training: trainingSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          });
        } catch (err) {
          console.error("Failed to fetch dashboard data:", err);
          setError("Failed to load dashboard data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);
  
    if (loading) return <div className="text-center p-4">Loading dashboard...</div>;
    if (error) return <div className="text-center p-4 text-red-600">Error: {error}</div>;
  
    const metrics = {
      daysSinceIncident: 47,
      openHazards: data.hazardIds.filter(h => h.status === 'Open' || h.status === 'Investigating').length,
      overdueItems: data.inspections.filter(i => i.status === 'Overdue').length,
      trainingCompliance: '94%',
    };
  
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Safety Dashboard</h2>
            <p className="text-slate-500 mt-1">An overview of your company's safety performance.</p>
          </div>
          <Link to="/hazards" className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors duration-300">
            <Plus className="mr-2 h-5 w-5" />
            Quick Report
          </Link>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard icon={Calendar} title="Days Since Last Incident" value={metrics.daysSinceIncident} color="green" />
          <MetricCard icon={AlertTriangle} title="Open Hazard IDs" value={metrics.openHazards} color="yellow" />
          <MetricCard icon={Clock} title="Overdue Items" value={metrics.overdueItems} color="red" />
          <MetricCard icon={TrendingUp} title="Training Compliance" value={metrics.trainingCompliance} color="blue" />
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityCard title="Recent Hazard IDs" data={data.hazardIds.slice(0, 3)} renderItem={hazard => (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-800">{hazard.description}</p>
                <p className="text-xs text-slate-500">{hazard.location} • {hazard.date}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(hazard.severity)}`}>
                {hazard.severity}
              </span>
            </>
          )} />
          <ActivityCard title="Upcoming Inspections" data={data.inspections} renderItem={inspection => (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-800">{inspection.type}</p>
                <p className="text-xs text-slate-500">{inspection.location} • Due: {inspection.dueDate}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(inspection.status)}`}>
                {inspection.status}
              </span>
            </>
          )} />
        </div>
      </div>
    );
  };

const MetricCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    green: 'border-green-500 text-green-600',
    yellow: 'border-yellow-500 text-yellow-600',
    red: 'border-red-500 text-red-600',
    blue: 'border-blue-500 text-blue-600',
  };
  return (
    <div className={`bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className="p-2 bg-slate-100 rounded-lg">
          <Icon className={`h-6 w-6 ${colors[color]}`} />
        </div>
      </div>
    </div>
  );
};

const ActivityCard = ({ title, data, renderItem }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
    <div className="space-y-3">
      {data.length > 0 ? data.map(item => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
          {renderItem(item)}
        </div>
      )) : <p className="text-sm text-slate-500">No recent activity.</p>}
    </div>
  </div>
);

const HazardManagement = () => {
    const { userData } = useAuth();
    const [hazards, setHazards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list');
    const [selectedHazard, setSelectedHazard] = useState(null);
    const [newHazard, setNewHazard] = useState({
      location: '', type: 'Unsafe Condition', severity: 'Medium', description: '', status: 'Open',
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [analysisError, setAnalysisError] = useState('');

    const fetchHazards = async () => {
      setLoading(true);
      const hazardSnapshot = await getDocs(collection(db, 'hazardIds'));
      setHazards(hazardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
  
    useEffect(() => {
      fetchHazards();
    }, []);
  
    const handleSubmitHazard = async (e) => {
      e.preventDefault();
      if (!newHazard.description || !newHazard.location) return;
      try {
        await addDoc(collection(db, "hazardIds"), {
          ...newHazard,
          reportedBy: userData?.displayName || 'Unknown User',
          date: new Date().toISOString().split('T')[0],
          timestamp: serverTimestamp()
        });
        setView('list');
        setNewHazard({ location: '', type: 'Unsafe Condition', severity: 'Medium', description: '', status: 'Open' });
        fetchHazards();
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    };
  
    const handleViewDetails = (hazard) => {
      setSelectedHazard(hazard);
      setAnalysisResult('');
      setAnalysisError('');
      setView('details');
    };

    const handleAnalyzeHazard = async () => {
        if (!selectedHazard) return;
        setIsAnalyzing(true);
        setAnalysisResult('');
        setAnalysisError('');
        
        const prompt = `You are an expert safety advisor for an oil and gas well servicing company in Alberta, Canada. A new hazard has been reported with the following description: "${selectedHazard.description}" at location "${selectedHazard.location}" with a severity of "${selectedHazard.severity}".

        Based on the principles of a Zero Incident Protocol (ZIP) and Energy Safety Canada guidelines, provide a brief, actionable analysis in three distinct sections. Use markdown for formatting.
        
        1.  **Potential Root Causes:** (List 2-3 likely underlying reasons this hazard occurred).
        2.  **Suggested Immediate Controls:** (List 2-3 practical actions to take immediately to secure the area and prevent injury).
        3.  **Recommended Long-Term Corrective Actions:** (List 2-3 systemic changes or actions to prevent recurrence, such as training updates, procedure changes, or equipment reviews).`;

        try {
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setAnalysisResult(text);
            } else {
                throw new Error("Invalid response structure from API.");
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            setAnalysisError("Failed to get analysis. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };
  
    if (view === 'form') {
      return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Report New Hazard</h3>
          <form onSubmit={handleSubmitHazard} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <div className="mt-1 relative">
                <input type="text" value={newHazard.location} onChange={(e) => setNewHazard({ ...newHazard, location: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., Bay 2, Wellsite A-15" required />
                <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Hazard Type</label>
              <select value={newHazard.type} onChange={(e) => setNewHazard({ ...newHazard, type: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-teal-500">
                <option>Unsafe Condition</option> <option>Unsafe Act</option> <option>Equipment Issue</option> <option>Near Miss</option> <option>Environmental</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Severity Level</label>
              <div className="mt-2 flex space-x-4">
                {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                  <label key={level} className="flex items-center">
                    <input type="radio" value={level} checked={newHazard.severity === level} onChange={(e) => setNewHazard({ ...newHazard, severity: e.target.value })} className="h-4 w-4 text-teal-600 border-slate-300 focus:ring-teal-500" />
                    <span className="ml-2 text-sm text-slate-700">{level}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea value={newHazard.description} onChange={(e) => setNewHazard({ ...newHazard, description: e.target.value })} rows={4} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-teal-500" placeholder="Describe the hazard or safety issue in detail..." required />
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500">
              <Camera className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">Click to add photos</p>
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-semibold transition-colors">Submit Report</button>
              <button type="button" onClick={() => setView('list')} className="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 font-semibold transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      );
    }
  
    if (view === 'details' && selectedHazard) {
      return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-teal-600 font-semibold mb-6 hover:text-teal-800">
            <ArrowLeft className="h-4 w-4" /> Back to List
          </button>
          <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedHazard.type}</h3>
                  <div className="text-sm text-slate-500 flex items-center gap-4 mt-2">
                    <span>📍 {selectedHazard.location}</span>
                    <span>👤 {selectedHazard.reportedBy}</span>
                    <span>📅 {selectedHazard.date}</span>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColor(selectedHazard.severity)}`}>{selectedHazard.severity}</span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColor(selectedHazard.status)}`}>{selectedHazard.status}</span>
              </div>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6">
              <h4 className="text-lg font-bold text-slate-700">Full Description</h4>
              <p className="mt-2 text-slate-600 whitespace-pre-wrap">{selectedHazard.description}</p>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-slate-700">AI Safety Analysis</h4>
                <button onClick={handleAnalyzeHazard} disabled={isAnalyzing} className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400">
                    {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Sparkles className="mr-2 h-5 w-5" />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Hazard'}
                </button>
            </div>
            {analysisResult && <div className="mt-4 p-4 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />}
            {analysisError && <p className="mt-4 text-sm text-red-600">{analysisError}</p>}
          </div>
        </div>
      );
    }
  
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-slate-800">Hazard Management</h2>
          <button onClick={() => setView('form')} className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-300">
            <AlertTriangle className="mr-2 h-5 w-5" /> Report Hazard
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading hazards...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {hazards.length > 0 ? hazards.map((hazard) => (
                <div key={hazard.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(hazard.severity)}`}>{hazard.severity}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(hazard.status)}`}>{hazard.status}</span>
                    </div>
                    <button onClick={() => handleViewDetails(hazard)} className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center gap-1">
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">{hazard.description}</h4>
                  <div className="text-sm text-slate-500 flex items-center gap-4">
                    <span>📍 {hazard.location}</span>
                    <span>👤 {hazard.reportedBy}</span>
                    <span>📅 {hazard.date}</span>
                  </div>
                </div>
              )) : <p className="p-4 text-slate-500">No hazard reports have been submitted yet.</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

const InspectionManagement = () => <div className="text-2xl font-bold text-slate-800">Inspection Management Page</div>;
const TrainingManagement = () => <div className="text-2xl font-bold text-slate-800">Training Management Page</div>;

const PolicyManagement = () => {
    const { user } = useAuth();
    const [policy, setPolicy] = useState(null);
    const [acknowledgments, setAcknowledgments] = useState([]);
    const [loading, setLoading] = useState(true);
  
    const policyId = "zip-policy-v1";
  
    useEffect(() => {
      const fetchPolicyData = async () => {
        setLoading(true);
        const policyContent = {
          title: "ZIP - Zero Incident Protocol",
          version: "1.0",
          effectiveDate: "January 1, 2025",
          summary: "This Zero Incident Protocol (ZIP) articulates Frontier Well Servicing's definitive commitment to fostering a safe, healthy, and incident-free work environment..."
        };
        setPolicy(policyContent);
  
        const ackQuery = query(collection(db, "policyAcknowledgments"), where("policyId", "==", policyId));
        const ackSnapshot = await getDocs(ackQuery);
        setAcknowledgments(ackSnapshot.docs.map(doc => doc.data()));
        setLoading(false);
      };
      fetchPolicyData();
    }, [user]);
  
    const handleAcknowledge = async () => {
      if (!user) return;
      const ackRef = doc(db, "policyAcknowledgments", `${policyId}_${user.uid}`);
      try {
        await setDoc(ackRef, {
          policyId: policyId,
          userId: user.uid,
          email: user.email,
          acknowledgedAt: serverTimestamp()
        });
        const ackSnapshot = await getDocs(query(collection(db, "policyAcknowledgments"), where("policyId", "==", policyId)));
        setAcknowledgments(ackSnapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Error acknowledging policy: ", error);
      }
    };
  
    const userHasAcknowledged = acknowledgments.some(ack => ack.userId === user?.uid);
  
    if (loading) return <div>Loading policy...</div>;
  
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-800">Policy Management</h2>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-slate-800">{policy.title}</h3>
          <div className="flex gap-4 text-sm text-slate-500 mt-2">
            <span>Version: {policy.version}</span>
            <span>Effective: {policy.effectiveDate}</span>
          </div>
          <p className="mt-4 text-slate-600">{policy.summary}</p>
          <div className="mt-6">
            {userHasAcknowledged ? (
              <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <p className="font-semibold">You have acknowledged this policy.</p>
              </div>
            ) : (
              <button onClick={handleAcknowledge} className="w-full bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors">
                Acknowledge and Confirm
              </button>
            )}
          </div>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Acknowledgment Status ({acknowledgments.length} users)</h3>
            <ul className="divide-y divide-slate-200">
                {acknowledgments.map(ack => (
                    <li key={ack.userId} className="py-2 flex justify-between items-center">
                        <span className="text-slate-700">{ack.email}</span>
                        <span className="text-sm text-slate-500">{ack.acknowledgedAt ? new Date(ack.acknowledgedAt.toDate()).toLocaleString() : 'Date not available'}</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    );
};

const ReportsView = () => {
    const [reportData, setReportData] = useState(null);
    const [generating, setGenerating] = useState(false);
  
    const generateReport = async () => {
      setGenerating(true);
      const [hazardSnapshot, ackSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'hazardIds')),
        getDocs(collection(db, 'policyAcknowledgments')),
        getDocs(collection(db, 'users'))
      ]);
  
      const hazards = hazardSnapshot.docs.map(doc => doc.data());
      const acknowledgments = ackSnapshot.docs.map(doc => doc.data());
      const users = usersSnapshot.docs.map(doc => doc.data());
  
      const structuredReport = {
        elementA: {
          title: "Management, Leadership, and Organizational Commitment",
          policyStatus: "ZIP Policy v1.0 is in effect.",
          acknowledgmentRate: `${acknowledgments.length} of ${users.length} users have acknowledged the policy.`,
        },
        elementB: {
          title: "Hazard Assessment",
          totalHazards: hazards.length,
          openHazards: hazards.filter(h => h.status === 'Open').length,
          criticalHazards: hazards.filter(h => h.severity === 'Critical').length,
        },
      };
      setReportData(structuredReport);
      setGenerating(false);
    };
  
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-slate-800">Reports & Audits</h2>
          <button onClick={generateReport} disabled={generating} className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300 disabled:bg-blue-400">
            {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Download className="mr-2 h-5 w-5" />}
            {generating ? 'Generating...' : 'Generate Audit Report'}
          </button>
        </div>
        
        {reportData && (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">COR Audit Summary</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-700">{reportData.elementA.title}</h4>
                <p className="text-sm text-slate-600">Policy Status: {reportData.elementA.policyStatus}</p>
                <p className="text-sm text-slate-600">Acknowledgment Rate: {reportData.elementA.acknowledgmentRate}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-700">{reportData.elementB.title}</h4>
                <p className="text-sm text-slate-600">Total Hazards Reported: {reportData.elementB.totalHazards}</p>
                <p className="text-sm text-slate-600">Open Hazards: {reportData.elementB.openHazards}</p>
                <p className="text-sm text-slate-600">Critical Hazards: {reportData.elementB.criticalHazards}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

const LoginScreen = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError("Login failed. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-teal-600 mx-auto" />
          <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900">Frontier Sentinel</h2>
          <p className="mt-2 text-center text-sm text-slate-600">Safety Management Platform</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Email address" />
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Password" />
          </div>
          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400 transition-colors duration-300">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main Application Layout ---
const MainAppLayout = ({ children }) => {
  const { userData, signOut } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, path: '/' },
    { id: 'hazards', label: 'Hazard IDs', icon: AlertTriangle, path: '/hazards' },
    { id: 'inspections', label: 'Inspections', icon: CheckSquare, path: '/inspections' },
    { id: 'training', label: 'Training', icon: Users, path: '/training' },
    { id: 'policies', label: 'Policies', icon: FileText, path: '/policies' },
    { id: 'reports', label: 'Reports', icon: TrendingUp, path: '/reports' },
  ];

  const renderNavigation = (isMobile = false) => (
    <nav className="flex-1 px-4 py-4 space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => isMobile && setShowMobileMenu(false)}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-slate-800">
          <div className="flex items-center flex-shrink-0 px-6 h-20 border-b border-slate-700">
            <Shield className="w-8 h-8 text-teal-400" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-white">Frontier Sentinel</h1>
              <p className="text-xs text-slate-400">Safety Management</p>
            </div>
          </div>
          <div className="flex-grow flex flex-col overflow-y-auto">{renderNavigation()}</div>
          <div className="flex-shrink-0 flex border-t border-slate-700 p-4">
            <div className="flex items-center w-full">
              <User className="h-9 w-9 text-slate-300" />
              <div className="ml-3">
                <p className="text-sm font-semibold text-white">{userData?.displayName || 'User'}</p>
                <p className="text-xs text-slate-400 capitalize">{userData?.role || 'user'}</p>
              </div>
              <button onClick={signOut} className="ml-auto text-slate-400 hover:text-white transition-colors duration-200">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-md">
          <Settings className="h-6 w-6" />
        </button>
        {showMobileMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative w-64 h-full bg-slate-800" onClick={e => e.stopPropagation()}>
              {renderNavigation(true)}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
};

// --- App Router ---
function App() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" />} />
        <Route path="/*" element={user ? <ProtectedRoutes /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

// --- Protected Routes ---
const ProtectedRoutes = () => (
  <MainAppLayout>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/hazards" element={<HazardManagement />} />
      <Route path="/inspections" element={<InspectionManagement />} />
      <Route path="/training" element={<TrainingManagement />} />
      <Route path="/policies" element={<PolicyManagement />} />
      <Route path="/reports" element={<ReportsView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </MainAppLayout>
);

export default App;
