import { useState, useEffect, useRef } from "react";
import { User, Upload, Trash2, Bot, BookOpen, Menu, Sun, Moon, Camera, Plus, X, Save, Phone, Mail, Globe, MapPin, Award, FileText } from "lucide-react";


function ProfileDashboard({ darkMode = true, setDarkMode = () => {}, setDashboardPage = () => {}, userId, userProfileData, setUserProfileData }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState(userProfileData);
  const fileInputRef = useRef(null);


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

  useEffect(() => {
    if (profileData.id) {
      loadUserImage();
    }
  }, [profileData.id]);

  const loadUserImage = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${profileData.id}/image`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.imageUrl) {
          setProfileData(prev => ({
            ...prev,
            profilePhoto: result.imageUrl
          }));
        }
      }
    } catch (error) {
      console.log('No existing image found or error loading image:', error);
    }
  };


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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(`http://localhost:5000/api/users/${profileData.id}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProfileData(prev => ({
          ...prev,
          profilePhoto: result.imageUrl
        }));
        alert('Profile picture updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageDelete = async () => {
    if (!profileData.profilePhoto || !window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setIsUploadingImage(true);

    try {
      const response = await fetch(`http://localhost:5000/api/users/${profileData.id}/image`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setProfileData(prev => ({
          ...prev,
          profilePhoto: null
        }));
        alert('Profile picture removed successfully!');
      } else {
        throw new Error(result.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Error removing image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };




  // Enhanced API-integrated save function
  const handleSave = async () => {
    if (!profileData.id) {
      alert("No user ID found. Cannot save.");
      return;
    }

    setUserProfileData(profileData); // Update parent state


    setIsLoading(true);
    try {
      const apiUrl = `http://localhost:5000/api/users/${profileData.id}/profile`;
      const payload = {
        firstName: profileData.name.split(" ")[0],
        lastName: profileData.name.split(" ").slice(1).join(" "),
        email: profileData.contacts.email,
        phone: profileData.contacts.phone,
        address:  profileData.contacts.address,
        bio: profileData.description,
        website: profileData.links.find(link => link.label.toLowerCase() === "website")?.url || "",
        socialMedia: {
          linkedin: profileData.links.find(link => link.label.toLowerCase() === "linkedin")?.url || "",
        },
        occupation: agentTypes.find(type => type.value === profileData.agentType)?.label || profileData.agentType,
        profilePicture: profileData.profilePhoto,
        agentType: profileData.agentType,
        theme: profileData.theme,
        certificates: profileData.certificates,
        links: profileData.links
      };

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Failed to update profile: ${response.status}`);

      const result = await response.json();
      if (result.success) alert("Profile updated successfully!");
      else throw new Error(result.message || "Unknown error");

    } catch (err) {
      console.error(err);
      alert("Error updating profile. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

 


  return (
    <div className={`transition-colors pb-40 duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Loading overlay */}
      { (isLoading || isUploadingImage) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-900 dark:text-white">Saving profile...</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

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
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Camera size={24} className="mr-2" />
                      Profile Photo
                    </h2>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      Upload a professional photo to build trust with clients
                    </p>
                    
                    {/* Upload/Delete buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={triggerFileInput}
                        disabled={isUploadingImage}
                        className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                          darkMode 
                            ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10' 
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                        } ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload size={16} className="mr-2" />
                        {profileData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      
                      {profileData.profilePhoto && (
                        <button
                          onClick={handleImageDelete}
                          disabled={isUploadingImage}
                          className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                            darkMode 
                              ? 'border-red-500 text-red-400 hover:bg-red-500/10' 
                              : 'border-red-500 text-red-600 hover:bg-red-50'
                          } ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Remove Photo
                        </button>
                      )}
                    </div>

                    {/* File requirements */}
                    <p className={`text-sm mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                    </p>
                  </div>

                  <div className="relative ml-6">
                    {profileData.profilePhoto ? (
                      <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-gray-300">
                        <img
                          src={profileData.profilePhoto}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    
                    {/* Camera overlay button */}
                    <button
                      onClick={triggerFileInput}
                      disabled={isUploadingImage}
                      className={`absolute -bottom-2 -right-2 p-2 ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } rounded-full transition-colors border-2 border-white ${
                        isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUploadingImage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <Camera size={16} />
                      )}
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
                    className="flex items-center rounded-lg text-gray-400 hover:text-yellow-100 hover:scale-105 transition-transform transition-colors duration-300"
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
                          darkMode ? 'hover:text-red-400 text-gray-400' : 'hover: text-red-500'
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
                    className="flex items-center rounded-lg text-gray-400 hover:text-yellow-100 hover:scale-105 transition-transform transition-colors duration-300"
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
                          } focus:outline-none focus:ring-2 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                        />
                      </div>
                      <button
                        onClick={() => removeCertificate(index)}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode ? 'hover:text-red-400 text-gray-400' : 'hover:bg-gray-100 text-red-500'
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
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isLoading
                      ? 'bg-gray-500/20 border border-gray-500 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500/20 border border-green-400 text-green-400 hover:bg-green-500/50 hover:text-green-300'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} className="mr-2" />
                      Update Profile
                    </>
                  )}
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