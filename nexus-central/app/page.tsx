export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Nexus Central Server
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Central management API for Nexus desktop application installations.
          </p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                API Status
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 dark:text-gray-300">All systems operational</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Available Endpoints
              </h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="text-blue-600 dark:text-blue-400">POST</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">/api/company/register</span>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="text-blue-600 dark:text-blue-400">POST</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">/api/company/validate</span>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="text-blue-600 dark:text-blue-400">POST</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">/api/company/heartbeat</span>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="text-green-600 dark:text-green-400">GET</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">/api/updates/check</span>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="text-green-600 dark:text-green-400">GET</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">/api/updates/latest.yml</span>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                For documentation and integration details, please refer to the 
                <a href="https://github.com/yourusername/nexus-central" className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
                  GitHub repository
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}