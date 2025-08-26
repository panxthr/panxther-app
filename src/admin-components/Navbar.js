import { useState } from "react";
import { User, Bot, BookOpen, Menu, Sun, Moon, Settings, Newspaper } from "lucide-react";

export default function Navbar({ darkMode = false, setDarkMode = () => {}, setDashboardPage = () => {}, currentPage}) {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: "Profile", icon: <User size={20} />, href: "profile" },
    { name: "AI Chatbot", icon: <Bot size={20} />, href: "chatbot" },
    { name: "Blog", icon: <BookOpen size={20} />, href: "blog" },
    { name: "Newsletter", icon: <Newspaper size={20} />, href: "newsletter" },
    { name: "Settings", icon: <Settings size={20} />, href: "settings" }
  ];

  // Panther SVG icon
  const PantherIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-purple-400">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );

  const handleMenuClick = (href) => {
    setDashboardPage(href);
    setOpen(false); // Close mobile menu after selection
  };

  return (
    <nav
      className={`${
        darkMode ? "bg-neutral-900" : "bg-gray-800"
      } ${
        open 
          ? "w-full h-auto md:w-64 md:h-screen flex-col" 
          : "w-full h-16 md:w-64 md:h-screen flex-row md:flex-col"
      } border-r-0 md:border-r border-b md:border-b-0 ${
        darkMode ? "border-neutral-700" : "border-neutral-900"
      } text-white flex transition-all duration-300 ease-in-out fixed md:static top-0 left-0 z-50`}
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      {/* Logo + Hamburger */}
      <div className={`flex items-center justify-between p-4 ${open ? 'border-b border-neutral-800 w-full' : 'w-full md:w-auto'} ${!open ? 'md:border-b md:border-neutral-800' : ''}`}>
        <div className="flex items-center gap-2">
          <PantherIcon />
          <span className="font-bold text-lg transition-opacity duration-200">
            panxther
          </span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Menu */}
      <ul className={`${open ? 'flex flex-col w-full' : 'hidden'} md:flex md:flex-col md:flex-1 p-3 mt-2 md:mt-2`}>
        {menuItems.map((item) => (
          <li key={item.name}>
            <button
              onClick={() => handleMenuClick(item.href)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative ${
                currentPage === item.href 
                  ? ' text-yellow-400' 
                  : 'hover:text-yellow-400'
              }`}
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
              }`}>
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

      {/* Dark/Light Toggle */}
      <div className={`${open ? 'block w-full' : 'hidden'} md:block p-3 border-t border-neutral-800 mt-auto`}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 w-full group"
        >
          <div className="text-gray-400 group-hover:text-yellow-400 transition-colors duration-200">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <span className="text-gray-300 group-hover:text-white transition-colors duration-200 font-bold whitespace-nowrap">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>
    </nav>
  );
}