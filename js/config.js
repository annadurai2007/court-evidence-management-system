/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * config.js - Global Frontend Client Configuration
 * 
 * CONFIGURING DEPLOYED BACKEND FOR NETLIFY:
 * 1. When running on localhost, CEMS defaults to 'http://127.0.0.1:5000/api'.
 * 2. For Netlify or production hosting, configure your backend URL via:
 *    - Setting 'defaultProductionApi' below, OR
 *    - Injecting window.CEMS_API_URL before this script loads, OR
 *    - Setting localStorage.setItem('cems_api_url', 'https://your-backend-domain.com/api'), OR
 *    - Using the API Endpoint setting in the Settings page.
 */

(function() {
  const defaultLocalApi = 'http://127.0.0.1:5000/api';
  // Configured deployed backend URL on Render
  const defaultProductionApi = 'https://cems-backend-0tk3.onrender.com/api';

  const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]' ||
    window.location.protocol === 'file:'
  );

  // Resolve active API Base URL
  const storedApiUrl = localStorage.getItem('cems_api_url');
  let configuredUrl = window.CEMS_API_URL || storedApiUrl || (isLocalhost ? defaultLocalApi : defaultProductionApi);
  if (configuredUrl && configuredUrl.includes('YOUR-BACKEND')) {
    configuredUrl = defaultProductionApi;
    try { localStorage.removeItem('cems_api_url'); } catch(e) {}
  }

  // Graceful fallback prevents intrusive UI error toasts if Render instance is waking up
  const isProduction = !isLocalhost;
  const enableDemoFallback = true;

  window.CEMS_CONFIG = {
    // Active base API URL (e.g. 'http://127.0.0.1:5000/api' or 'https://api.yourdomain.com/api')
    apiUrl: configuredUrl,
    
    // Environment flag
    isLocalhost: isLocalhost,
    isProduction: isProduction,
    
    // Demo fallback is enabled to guarantee 100% uninterrupted UX during cloud cold starts
    enableDemoFallback: enableDemoFallback,

    // Allows quick runtime configuration without editing source code
    setApiUrl(url) {
      if (url && url.trim()) {
        localStorage.setItem('cems_api_url', url.trim());
      } else {
        localStorage.removeItem('cems_api_url');
      }
      window.location.reload();
    }
  };

  // Set global API URL for direct script access
  window.CEMS_API_URL = configuredUrl;
})();
