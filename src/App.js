import { use, useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ProfileDashboard from "./components/ProfileDashboard";
import ChatbotConfig from "./components/ChatbogConfig";
import BlogConfig from "./components/BlogConfig";
import NewsletterCondfig from "./components/NewsletterConfig";
import "./App.css";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";



export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [dashboardpage, setDashboardPage] = useState("profile");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedPage, setDisplayedPage] = useState("profile");

  useEffect(() => {
    console.log("Current Dashboard Page:", dashboardpage);
  }, [dashboardpage]);

  // Handle page transitions with fade effect
  useEffect(() => {
    if (dashboardpage !== displayedPage) {
      setIsTransitioning(true);
      
      // After fade out completes, change the content
      const timer = setTimeout(() => {
        setDisplayedPage(dashboardpage);
        setIsTransitioning(false);
      }, 200); // Half of the total transition time for smooth crossfade

      return () => clearTimeout(timer);
    }
  }, [dashboardpage, displayedPage]);

  const renderContent = () => {
    switch (displayedPage) {
      case "profile":
        return (
          <ProfileDashboard 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            setDashboardPage={setDashboardPage}
          />
        );
      case "chatbot":
        return (
          <ChatbotConfig
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            setDashboardPage={setDashboardPage}
          />
        );
      case "blog":
        return (
          <BlogConfig/>
        );
      case "newsletter":
        return (
          <NewsletterCondfig />
        );
      case "settings":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-100">Settings Page</h2>
            <p className="text-gray-400 mt-2">Settings content goes here</p>
          </div>
        );
      case "dashboard":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-100">Dashboard Overview</h2>
            <p className="text-gray-400 mt-2">Dashboard content goes here</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-100">Page Not Found</h2>
            <p className="text-gray-400 mt-2">The requested page could not be found</p>
          </div>
        );
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen font-sans overflow-hidden relative" style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}>
        {/* Shader-like Gradient Background */}
        <div className="absolute inset-0 bg-zinc-900">
          {/* Animated gradient base */}
          <div className="absolute inset-0 opacity-80">
            <div className="absolute opacity-30 inset-0 bg-gradient-to-br from-yellow-900/40 via-orange-800/30 to-red-900/20"></div>
          </div>
          
          {/* Multiple blurred light sources for shader effect */}
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-orange-500/25 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/5 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl"></div>
        </div>

        {/* Content over gradient */}
        <div className="flex w-full relative z-10">
          {/* Fixed Navbar */}
          <Navbar 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            setDashboardPage={setDashboardPage} 
            currentPage={dashboardpage}
          />
          
          {/* Main Content Area - Fixed height with scroll */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 pt-24 min-h-full backdrop-blur-sm bg-black/10 relative">
                {/* Content with fade transition */}
                <div 
                  className={`transition-opacity duration-400 ease-in-out ${
                    isTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}