'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  interface Stats {
    totalCompanies: number;
    activeInstallations: number;
    latestVersion: string;
  }
  
  const [stats, setStats] = useState<Stats | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchStats();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        sessionStorage.setItem('adminAuth', 'true');
        setIsAuthenticated(true);
        setError('');
        fetchStats();
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Authentication failed');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      console.error('Failed to fetch stats');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Admin Login
            </h1>
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nexus Admin Dashboard
            </h1>
            <button
              onClick={() => {
                sessionStorage.removeItem('adminAuth');
                router.push('/');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Total Companies
                </h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalCompanies || 0}
                </p>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Active Installations
                </h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.activeInstallations || 0}
                </p>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Latest Version
                </h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.latestVersion || 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
          )}
          
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/admin/companies"
                className="block p-4 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Manage Companies
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  View and manage registered companies
                </p>
              </a>
              
              <a
                href="/admin/updates"
                className="block p-4 bg-green-100 dark:bg-green-900 rounded hover:bg-green-200 dark:hover:bg-green-800"
              >
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Manage Updates
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Upload and manage software updates
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}