'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdatesPage() {
  interface Update {
    id: string;
    current_version: string;
    channel_name: string;
    release_notes?: string;
    is_mandatory: boolean;
    published_at: string;
  }
  
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    channel: 'stable',
    releaseNotes: '',
    fileUrl: '',
    isMandatory: false
  });
  const router = useRouter();

  useEffect(() => {
    // Check auth
    const auth = sessionStorage.getItem('adminAuth');
    if (auth !== 'true') {
      router.push('/admin');
      return;
    }
    
    fetchUpdates();
  }, [router]);

  const fetchUpdates = async () => {
    try {
      const response = await fetch('/api/admin/updates');
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.version || !formData.fileUrl) {
      alert('Version and file URL are required');
      return;
    }
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/admin/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: formData.version,
          channel: formData.channel,
          releaseNotes: formData.releaseNotes,
          fileUrl: formData.fileUrl,
          isMandatory: formData.isMandatory
        })
      });
      
      if (response.ok) {
        setShowForm(false);
        setFormData({
          version: '',
          channel: 'stable',
          releaseNotes: '',
          fileUrl: '',
          isMandatory: false
        });
        fetchUpdates();
      } else {
        alert('Failed to add update');
      }
    } catch {
      alert('Error adding update');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Updates
            </h1>
            <div className="space-x-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {showForm ? 'Cancel' : 'Add Update'}
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {showForm && (
            <div className="mb-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add New Update
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Version Number *
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                      placeholder="1.0.0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Channel
                    </label>
                    <select
                      value={formData.channel}
                      onChange={(e) => setFormData({...formData, channel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="stable">Stable</option>
                      <option value="beta">Beta</option>
                      <option value="alpha">Alpha</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GitHub Release URL *
                  </label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                    placeholder="https://github.com/redbay-Dev/nexumserver/releases/download/v1.0.0/nexum-setup.exe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the direct download URL from your GitHub release
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Release Notes
                  </label>
                  <textarea
                    value={formData.releaseNotes}
                    onChange={(e) => setFormData({...formData, releaseNotes: e.target.value})}
                    rows={3}
                    placeholder="What's new in this version..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mandatory"
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="mandatory" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this update mandatory
                  </label>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? 'Adding...' : 'Add Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How to Add Updates:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Upload your .exe file to GitHub releases</li>
              <li>Copy the direct download URL</li>
              <li>Click &quot;Add Update&quot; and fill in the form</li>
              <li>The Nexus app will automatically detect new updates</li>
            </ol>
          </div>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading updates...</p>
          ) : updates.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No updates published yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Release Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mandatory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Published
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {updates.map((update) => (
                    <tr key={update.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {update.current_version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          update.channel_name === 'stable' 
                            ? 'bg-green-100 text-green-800' 
                            : update.channel_name === 'beta'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {update.channel_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {update.release_notes || 'No notes'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {update.is_mandatory ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(update.published_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}