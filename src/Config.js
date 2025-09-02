import { use, useState, useEffect } from "react";
import Navbar from "./admin-components/Navbar";
import ProfileDashboard from "./admin-components/ProfileDashboard";
import ChatbotConfig from "./admin-components/ChatbogConfig";
import BlogConfig from "./admin-components/BlogConfig";
import NewsletterCondfig from "./admin-components/NewsletterConfig";
import StatsDashboard from "./admin-components/StatsDashboard";
import "./Config.css";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";



export default function Config() {
  const [darkMode, setDarkMode] = useState(true);
  const [dashboardpage, setDashboardPage] = useState("stats");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedPage, setDisplayedPage] = useState("stats");
  const [userId, setUserId] = useState("user_12345"); // Example user ID
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    id: userId, // Add the user ID to profile data
    name: "",
    agentType: "",
    description: "",
    profilePhoto: null,
    contacts: {
      phone: "",
      email: "",
      address: ""
    },
    links: [
      { label: "", url: "" },
      { label: "", url: "" }
    ],
    certificates: [
    ],
    theme: ""
  });

  const loadProfile = async () => {
      if (!userId) {
        console.warn("No user ID provided");
        return;
      }

      setIsLoading(true);
      try {
        const apiUrl = `http://localhost:5000/api/users/${userId}/profile`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error(`Failed to fetch profile: ${response.status}`);

        const result = await response.json();

        if (result.success) {
          const serverProfile = result.profile;

          console.log("Fetched profile data:", serverProfile);

          setProfileData({
            id: userId,
            name: `${serverProfile.firstName || ""} ${serverProfile.lastName || ""}`.trim(),
            agentType: serverProfile.agentType || "",
            description: serverProfile.bio || "",
            profilePhoto: serverProfile.profilePicture || null,
            contacts: {
              phone: serverProfile.phone || "",
              email: serverProfile.email || "",
              address: serverProfile.address || ""
            },
            links: [
              { label: "LinkedIn", url: serverProfile.socialMedia?.linkedin || "" },
              { label: "Website", url: serverProfile.website || "" }
            ],
            certificates: serverProfile.certificates || [],
            theme: serverProfile.theme || "elegant"
          });
        } else {
          console.error("Failed to fetch profile:", result.message);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    console.log(profileData);
  }, [profileData]);

  
  useEffect(() => {
    loadProfile();
    console.log("Profile data loaded:", profileData);
  }, []);

 

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
            userId={userId}
            userProfileData={profileData}
            setUserProfileData={setProfileData}
          />
        );
      case "stats":
        return (
          <StatsDashboard 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            setDashboardPage={setDashboardPage}
            userId={userId}
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
        <div className="absolute inset-0 bg-neutral-950">
          {/* Animated gradient base */}
          <div className="absolute inset-0 opacity-80">
            <div className="absolute opacity-30 inset-0 bg-zinc-950"></div>
          </div>
          
          {/* Multiple blurred light sources for shader effect */}

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