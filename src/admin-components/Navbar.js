import { useState } from "react";
import { User, Bot, BookOpen, Menu, Sun, Moon, Settings, Newspaper, LayoutDashboard, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function Navbar({ darkMode = false, setDarkMode = () => {}, setDashboardPage = () => {}, currentPage = "stats"}) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "stats" },
    { name: "Profile", icon: <User size={20} />, href: "profile" },
    { name: "AI Chatbot", icon: <Bot size={20} />, href: "chatbot" },
    { name: "Blog", icon: <BookOpen size={20} />, href: "blog" },
    { name: "Newsletter", icon: <Newspaper size={20} />, href: "newsletter" },
    { name: "Settings", icon: <Settings size={20} />, href: "settings" }
  ];

  const handleMenuClick = (href) => {
    setDashboardPage(href);
    setOpen(false); // Close mobile menu after selection
  };

  const handleSignOut = () => {
    // Add your sign out logic here
    console.log("Signing out...");
  };

  return (
    <nav
      className={`${
        darkMode ? "bg-black" : "bg-gray-800"
      } ${
        open 
          ? "w-full h-auto md:w-64 md:h-screen flex-col" 
          : `w-full h-16 ${minimized ? 'md:w-16' : 'md:w-64'} md:h-screen flex-row md:flex-col`
      } border-r-0 md:border-r border-b md:border-b-0 ${
        darkMode ? "border-neutral-800" : "border-neutral-900"
      } text-white flex transition-all duration-300 ease-in-out fixed md:static top-0 left-0 z-50`}
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      {/* Logo + Hamburger + Minimize Toggle */}
      <div className={`flex items-center justify-between p-4 ${open ? 'border-b border-neutral-800 w-full' : 'w-full md:w-auto'} ${!open ? 'md:border-b md:border-neutral-800' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg transition-opacity duration-200 ${minimized ? 'md:hidden' : ''}`}>
            panxther
          </span>
          {minimized && <span className="hidden md:block font-bold text-lg">P</span>}
        </div>
        <div className="flex items-center gap-2">
          {/* Minimize toggle - desktop only */}
          
          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200`}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <button
            onClick={() => setMinimized(!minimized)}
            className={`hidden md:block rounded-lg text-gray-700 hover:text-yellow mt-4 transition-colors duration-200 ${!minimized ? 'ml-auto mr-2 mb-2':'mx-auto'}`}
          >
            {minimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

      {/* Menu - Vertically Centered */}
      <div className={`${open ? 'flex flex-col w-full' : 'hidden'} md:flex md:flex-col md:flex-1 md:justify-center p-3`}>
        
        <ul className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => handleMenuClick(item.href)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative ${
                  currentPage === item.href 
                    ? 'text-yellow-400' 
                    : 'hover:text-yellow-400'
                } ${minimized ? 'md:justify-center' : ''}`}
                title={minimized ? item.name : ''}
              >
                <div className={`transition-colors duration-200 ${
                  currentPage === item.href 
                    ? 'text-yellow-400' 
                    : 'text-gray-400 group-hover:text-yellow-400'
                }`}>
                  {item.icon}
                </div>
                <span className={`transition-all duration-200 font-medium whitespace-nowrap ${
                  currentPage === item.href 
                    ? 'text-yellow-400' 
                    : 'text-gray-300 group-hover:text-yellow-400'
                } ${minimized ? 'md:hidden' : ''}`}>
                  {item.name}
                </span>
                {/* Active/Hover indicator */}
                <div className={`absolute left-0 w-1 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r transition-all duration-200 ${
                  currentPage === item.href 
                    ? 'h-6' 
                    : 'h-0 group-hover:h-6'
                }`}></div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Dark/Light Toggle + Sign Out */}
      <div className={`${open ? 'block w-full' : 'hidden'} md:block p-3 mt-auto space-y-2`}>
        {/* Dark/Light Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 w-full group ${minimized ? 'md:justify-center' : ''}`}
          title={minimized ? (darkMode ? "Light Mode" : "Dark Mode") : ''}
        >
          <div className="text-gray-400 group-hover:text-yellow-400 transition-colors duration-200">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <span className={`text-gray-300 group-hover:text-white transition-colors duration-200 font-medium whitespace-nowrap ${minimized ? 'md:hidden' : ''}`}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
        
        {/* Border */}
        <div className="border-t border-neutral-800"></div>
        
        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-all duration-200 w-full group ${minimized ? 'md:justify-center' : ''}`}
          title={minimized ? "Sign Out" : ''}
        >
          <div className="text-gray-400 group-hover:text-red-400 transition-colors duration-200">
            <LogOut size={18} />
          </div>
          <span className={`text-gray-300 group-hover:text-red-400 transition-colors duration-200 font-medium whitespace-nowrap ${minimized ? 'md:hidden' : ''}`}>
            Sign Out
          </span>
        </button>
      </div>
    </nav>
  );
}