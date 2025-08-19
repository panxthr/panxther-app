import { useState } from "react";
import { User, Bot, BookOpen, Menu, Sun, Moon, Camera, Plus, X, Save, Phone, Mail, Globe, MapPin, Award, FileText } from "lucide-react";


function ProfileDashboard({ darkMode = true, setDarkMode = () => {}, setDashboardPage = () => {} }) {
  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "John Smith",
    agentType: "insurance",
    description: "Experienced insurance agent specializing in life and auto coverage with over 10 years in the industry.",
    profilePhoto: null,
    contacts: {
      phone: "+1 (555) 123-4567",
      email: "john.smith@email.com",
      address: "New York, NY"
    },
    links: [
      { label: "LinkedIn", url: "https://linkedin.com/in/johnsmith" },
      { label: "Website", url: "https://johnsmith.com" }
    ],
    certificates: [
      { name: "Licensed Insurance Agent", issuer: "State Insurance Board", year: "2020" },
      { name: "Property & Casualty License", issuer: "Insurance Institute", year: "2019" }
    ],
    theme: "elegant"
  });

  const agentTypes = [
    { value: "insurance", label: "Insurance Agent" },
    { value: "property", label: "Property Agent" },
    { value: "financial", label: "Financial Advisor" },
    { value: "legal", label: "Legal Consultant" },
    { value: "tax", label: "Tax Consultant" },
    { value: "business", label: "Business Consultant" }
  ];

  const themes = [
    { value: "elegant", label: "Elegant", colors: "bg-gradient-to-br from-slate-50 to-slate-100" },
    { value: "casual", label: "Casual", colors: "bg-gradient-to-br from-blue-50 to-indigo-100" },
    { value: "professional", label: "Professional", colors: "bg-gradient-to-br from-gray-900 to-gray-700" },
    { value: "modern", label: "Modern", colors: "bg-gradient-to-br from-purple-50 to-pink-100" },
    { value: "vibrant", label: "Vibrant", colors: "bg-gradient-to-br from-orange-50 to-red-100" },
    { value: "minimal", label: "Minimal", colors: "bg-gradient-to-br from-green-50 to-emerald-100" }
  ];

  const updateProfileData = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedData = (parent, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const addLink = () => {
    setProfileData(prev => ({
      ...prev,
      links: [...prev.links, { label: "", url: "" }]
    }));
  };

  const removeLink = (index) => {
    setProfileData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const addCertificate = () => {
    setProfileData(prev => ({
      ...prev,
      certificates: [...prev.certificates, { name: "", issuer: "", year: "" }]
    }));
  };

  const removeCertificate = (index) => {
    setProfileData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const updateCertificate = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      certificates: prev.certificates.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const handleSave = () => {
    const jsonData = JSON.stringify(profileData, null, 2);
    console.log("Profile Data:", jsonData);
    
    // Create a downloadable JSON file
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Profile saved successfully!");
  };

  return (
    <div className={`transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen(!open)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="font-poppins">
        <div className="">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Customize your freelancer agent profile to attract the right clients
              </p>
            </div>

            <div className="space-y-8">
              {/* Profile Photo Section */}
              <div className={`${
                darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
              } backdrop-blur-md rounded-2xl border p-6`}>

                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Camera size={24} className="mr-2" />
                  Profile Photo
                </h2>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button className={`absolute -bottom-2 -right-2 p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition-colors`}>
                      <Camera size={16} />
                    </button>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      Upload a professional photo to build trust with clients
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Change Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className={`${
                darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
              } backdrop-blur-md rounded-2xl border p-6`}>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User size={24} className="mr-2" />
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => updateProfileData('name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Agent Type</label>
                    <select
                      value={profileData.agentType}
                      onChange={(e) => updateProfileData('agentType', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    >
                      {agentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={profileData.description}
                    onChange={(e) => updateProfileData('description', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                        : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    placeholder="Tell potential clients about your expertise and experience..."
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className={`${
                darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
              } backdrop-blur-md rounded-2xl border p-6`}>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Phone size={24} className="mr-2" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.contacts.phone}
                      onChange={(e) => updateNestedData('contacts', 'phone', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileData.contacts.email}
                      onChange={(e) => updateNestedData('contacts', 'email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      type="text"
                      value={profileData.contacts.address}
                      onChange={(e) => updateNestedData('contacts', 'address', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                    />
                  </div>
                </div>
              </div>

              {/* Links Section */}
              <div className={`${
                darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
              } backdrop-blur-md rounded-2xl border p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Globe size={24} className="mr-2" />
                    Links
                  </h2>
                  <button
                    onClick={addLink}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Link
                  </button>
                </div>
                <div className="space-y-4">
                  {profileData.links.map((link, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Label (e.g., LinkedIn)"
                          value={link.label}
                          onChange={(e) => updateLink(index, 'label', e.target.value)}
                          className={`px-4 py-3 rounded-lg border transition-colors ${
                            darkMode 
                              ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                              : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                        />
                        <input
                          type="url"
                          placeholder="URL"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          className={`px-4 py-3 rounded-lg border transition-colors ${
                            darkMode 
                              ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                              : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                        />
                      </div>
                      <button
                        onClick={() => removeLink(index)}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-500'
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificates Section */}
              <div className={`${
                darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
              } backdrop-blur-md rounded-2xl border p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Award size={24} className="mr-2" />
                    Certificates & Licenses
                  </h2>
                  <button
                    onClick={addCertificate}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Certificate
                  </button>
                </div>
                <div className="space-y-4">
                  {profileData.certificates.map((cert, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Certificate Name"
                          value={cert.name}
                          onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                          className={`px-4 py-3 rounded-lg border transition-colors ${
                            darkMode 
                              ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                              : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                        />
                        <input
                          type="text"
                          placeholder="Issuing Organization"
                          value={cert.issuer}
                          onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
                          className={`px-4 py-3 rounded-lg border transition-colors ${
                            darkMode 
                              ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                              : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                        />
                        <input
                          type="text"
                          placeholder="Year"
                          value={cert.year}
                          onChange={(e) => updateCertificate(index, 'year', e.target.value)}
                          className={`px-4 py-3 rounded-lg border transition-colors ${
                            darkMode 
                              ? 'bg-zinc-900/50 border-gray-600 focus:border-blue-500' 
                              : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                        />
                      </div>
                      <button
                        onClick={() => removeCertificate(index)}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-500'
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div className={`${
                darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
              } backdrop-blur-md rounded-2xl border p-6`}>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FileText size={24} className="mr-2" />
                  Profile Theme
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateProfileData('theme', theme.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        profileData.theme === theme.value
                          ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
                          : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300')
                      }`}
                    >
                      <div className={`w-full h-20 rounded-lg mb-3 ${theme.colors}`}></div>
                      <p className="font-medium">{theme.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSave}
                  className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  <Save size={20} className="mr-2" />
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default ProfileDashboard;