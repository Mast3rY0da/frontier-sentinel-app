import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
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
  Loader2
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
          console.log("No user data found in Firestore for UID:", user.uid);
          setUserData({ displayName: user.email, role: 'user' });
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
    case 'Medium': case 'Investigating': case 'Expiring Soon':
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
        <Link to="/hazards/new" className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors duration-300">
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

const HazardManagement = () => <div className="text-2xl font-bold text-slate-800">Hazard Management Page</div>;
const InspectionManagement = () => <div className="text-2xl font-bold text-slate-800">Inspection Management Page</div>;
const TrainingManagement = () => <div className="text-2xl font-bold text-slate-800">Training Management Page</div>;
const PolicyManagement = () => <div className="text-2xl font-bold text-slate-800">Policy Management Page</div>;
const ReportsView = () => <div className="text-2xl font-bold text-slate-800">Reports Page</div>;

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
          <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900">
            Frontier Sentinel
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Safety Management Platform
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Email address"
            />
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Password"
            />
          </div>
          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400 transition-colors duration-300"
          >
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
