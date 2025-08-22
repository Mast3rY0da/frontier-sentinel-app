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
// This is your specific project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyBtKJZ880vy-n_-VJhXiW5G58HjO07-NtE",
  authDomain: "frontier-sentinel-aec47.firebaseapp.com",
  projectId: "frontier-sentinel-aec47",
  storageBucket: "frontier-sentinel-aec47.appspot.com",
  messagingSenderId: "211930423770",
  appId: "1:211930423770:web:3dbaebcc8f377ccc94a0e3",
  measurementId: "G-Y7EK8Z6X3V"
};

// Initialize Firebase and export the services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Authentication Hook (useAuth) ---
// This hook manages the user's login state throughout the app.
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          // Handle case where user exists in Auth but not in Firestore
          console.log("No user data found in Firestore for UID:", user.uid);
          setUserData({ displayName: user.email, role: 'user' }); // default data
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  return { user, userData, loading, signIn, signOut };
};


// --- Reusable Components ---
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
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
        const hazardSnapshot = await getDocs(collection(db, 'hazardIds'));
        const inspectionSnapshot = await getDocs(collection(db, 'inspections'));
        const trainingSnapshot = await getDocs(collection(db, 'training'));

        setData({
          hazardIds: hazardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          inspections: inspectionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          training: trainingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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
    daysSinceIncident: 47, // This would also come from your database
    openHazards: data.hazardIds.filter(h => h.status === 'Open' || h.status === 'Investigating').length,
    overdueItems: data.inspections.filter(i => i.status === 'Overdue').length,
    trainingCompliance: '94%', // This would be calculated
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Safety Dashboard
        </h2>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link to="/hazards/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Quick Report
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Calendar} title="Days Since Last Incident" value={metrics.daysSinceIncident} color="text-green-500" />
        <MetricCard icon={AlertTriangle} title="Open Hazard IDs" value={metrics.openHazards} color="text-yellow-500" />
        <MetricCard icon={Clock} title="Overdue Items" value={metrics.overdueItems} color="text-red-500" />
        <MetricCard icon={TrendingUp} title="Training Compliance" value={metrics.trainingCompliance} color="text-blue-500" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Hazard IDs</h3>
          <div className="space-y-3">
            {data.hazardIds.slice(0, 3).map(hazard => (
              <div key={hazard.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{hazard.description}</p>
                  <p className="text-sm text-gray-500">{hazard.location} • {hazard.date}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor(hazard.severity)}`}>
                  {hazard.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Inspections</h3>
          <div className="space-y-3">
            {data.inspections.map(inspection => (
              <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inspection.type}</p>
                  <p className="text-sm text-gray-500">{inspection.location} • Due: {inspection.dueDate}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor(inspection.status)}`}>
                  {inspection.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg p-5">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-lg font-medium text-gray-900">{value}</dd>
        </dl>
      </div>
    </div>
  </div>
);


const HazardManagement = () => {
  // This component will be built out later.
  return <div className="text-2xl font-bold">Hazard Management Page</div>;
};
const InspectionManagement = () => {
  return <div className="text-2xl font-bold">Inspection Management Page</div>;
};
const TrainingManagement = () => {
  return <div className="text-2xl font-bold">Training Management Page</div>;
};
const PolicyManagement = () => {
  return <div className="text-2xl font-bold">Policy Management Page</div>;
};
const ReportsView = () => {
  return <div className="text-2xl font-bold">Reports Page</div>;
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
      // On success, the `onAuthStateChanged` listener in `App` will handle navigation.
    } catch (err) {
      setError("Login failed. Please check your email and password.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Frontier Sentinel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Safety Management Platform
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password"
              />
            </div>
          </div>
          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
            </button>
          </div>
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
    <nav className="flex-1 px-2 pb-4 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => isMobile && setShowMobileMenu(false)}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
              isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-blue-900 border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <Shield className="w-8 h-8 text-blue-100" />
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-white">Frontier Sentinel</h1>
                <p className="text-xs text-blue-200">Safety Management</p>
              </div>
            </div>
            <div className="mt-8 flex-grow flex flex-col">{renderNavigation()}</div>
            <div className="flex-shrink-0 flex border-t border-blue-800 p-4">
              <div className="flex items-center w-full">
                <User className="h-8 w-8 text-blue-200" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{userData?.displayName || 'User'}</p>
                  <p className="text-xs text-blue-200 capitalize">{userData?.role || 'user'}</p>
                </div>
                <button onClick={signOut} className="ml-auto text-blue-200 hover:text-white">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="fixed top-4 left-4 z-50 p-2 bg-blue-900 text-white rounded-md"
        >
          <Settings className="h-6 w-6" />
        </button>
        {showMobileMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative w-64 h-full bg-blue-900" onClick={e => e.stopPropagation()}>
              <div className="flex items-center px-4 py-5">
                <Shield className="w-8 h-8 text-blue-100" />
                <h1 className="ml-3 text-lg font-semibold text-white">Frontier Sentinel</h1>
              </div>
              {renderNavigation(true)}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};


// --- App Router ---
// This is the main component that decides which page to show.
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" />} />
        <Route
          path="/*"
          element={user ? <ProtectedRoutes /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

// --- Protected Routes ---
// This component wraps all the pages that require a user to be logged in.
const ProtectedRoutes = () => {
  return (
    <MainAppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hazards" element={<HazardManagement />} />
        <Route path="/inspections" element={<InspectionManagement />} />
        <Route path="/training" element={<TrainingManagement />} />
        <Route path="/policies" element={<PolicyManagement />} />
        <Route path="/reports" element={<ReportsView />} />
        {/* Add more protected routes here */}
        <Route path="*" element={<Navigate to="/" />} /> {/* Redirect unknown paths to dashboard */}
      </Routes>
    </MainAppLayout>
  );
};

export default App;
