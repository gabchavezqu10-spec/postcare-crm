/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ClientHistory from './pages/ClientHistory';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Integrations from './pages/Integrations';
import Metrics from './pages/Metrics';
import ServiceSettings from './pages/ServiceSettings';
import WebhookHistory from './pages/WebhookHistory';
import Automations from './pages/Automations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ClientHistory": ClientHistory,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Integrations": Integrations,
    "Metrics": Metrics,
    "ServiceSettings": ServiceSettings,
    "WebhookHistory": WebhookHistory,
    "Automations": Automations,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};