import React, { useState, useEffect, useRef } from 'react';

interface DashboardHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DashboardHeader({ activeTab: initialTab = 'services', onTabChange }: DashboardHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userName, setUserName] = useState('John Doe');
  const [userEmail, setUserEmail] = useState('john.doe@email.com');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleTabClick = (tab: string) => {
    // Update local state
    setActiveTab(tab);
    
    // Dispatch custom event for Astro page to listen to
    window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab } }));
    
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-20">
          {/* Logo & Dashboard Title */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">C</span>
              </div>
              <div>
                <div className="font-bold text-xl text-foreground tracking-tight">CAPITUNE</div>
                <div className="text-xs text-muted-foreground -mt-1">Tableau de bord</div>
              </div>
            </a>
          </div>

          {/* Tab Navigation - Desktop ONLY */}
          <nav className="hidden md:flex items-center gap-2">
            <button 
              className={`tab-button px-6 py-3 font-semibold transition-all rounded-xl relative ${
                activeTab === 'services' 
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('services')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Services</span>
              </div>
              {activeTab === 'services' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground rounded-t-full"></div>
              )}
            </button>
            <button 
              className={`tab-button px-6 py-3 font-semibold transition-all rounded-xl relative ${
                activeTab === 'messagerie' 
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('messagerie')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Messagerie</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">3</span>
              </div>
              {activeTab === 'messagerie' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground rounded-t-full"></div>
              )}
            </button>
            <button 
              className={`tab-button px-6 py-3 font-semibold transition-all rounded-xl relative ${
                activeTab === 'paiements' 
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('paiements')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Paiements</span>
              </div>
              {activeTab === 'paiements' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground rounded-t-full"></div>
              )}
            </button>
            <button 
              className={`tab-button px-6 py-3 font-semibold transition-all rounded-xl relative ${
                activeTab === 'tarifs' 
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('tarifs')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v-1m-6 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Tarifs</span>
              </div>
              {activeTab === 'tarifs' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground rounded-t-full"></div>
              )}
            </button>
          </nav>

          {/* Profile Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-all"
            >
              {/* Avatar */}
              <div className="relative">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-border shadow-md"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center ring-2 ring-border shadow-md">
                    <span className="text-primary-foreground font-bold text-lg">{getInitials(userName)}</span>
                  </div>
                )}
                {/* Online Status */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card"></div>
              </div>
              
              {/* User Info - Desktop */}
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-foreground">{userName}</div>
                <div className="text-xs text-muted-foreground">Client Premium</div>
              </div>

              {/* Dropdown Arrow */}
              <svg 
                className={`w-4 h-4 text-muted-foreground transition-transform hidden md:block ${isProfileOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="relative group">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center ring-4 ring-primary/20">
                          <span className="text-primary-foreground font-bold text-2xl">{getInitials(userName)}</span>
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <div className="flex-1">
                      {isEditingProfile ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-2 py-1 text-sm font-bold text-foreground bg-background border border-border rounded"
                          />
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-muted-foreground bg-background border border-border rounded"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsEditingProfile(false)}
                              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
                            >
                              ✓ Sauvegarder
                            </button>
                            <button
                              onClick={() => setIsEditingProfile(false)}
                              className="text-xs bg-muted text-foreground px-3 py-1 rounded hover:bg-muted/80"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-foreground text-lg">{userName}</div>
                              <div className="text-sm text-muted-foreground">{userEmail}</div>
                            </div>
                            <button
                              onClick={() => setIsEditingProfile(true)}
                              className="text-primary hover:text-primary/80"
                              title="Modifier le profil"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                              ⭐ Premium
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button 
                    onClick={() => {
                      setIsEditingProfile(true);
                      setIsProfileOpen(true);
                    }}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors w-full"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">Mon profil</div>
                      <div className="text-xs text-muted-foreground">Gérer mes informations</div>
                    </div>
                  </button>

                  <a 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">Paramètres</div>
                      <div className="text-xs text-muted-foreground">Préférences du compte</div>
                    </div>
                  </a>

                  <a 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">Mes documents</div>
                      <div className="text-xs text-muted-foreground">Téléchargements et fichiers</div>
                    </div>
                  </a>

                  <a 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">Aide & Support</div>
                      <div className="text-xs text-muted-foreground">Centre d'aide</div>
                    </div>
                  </a>
                </div>

                {/* Logout */}
                <div className="border-t border-border py-2">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-3 px-6 py-3 w-full hover:bg-red-500/10 transition-colors group"
                  >
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-red-600 group-hover:text-red-700">Se déconnecter</div>
                      <div className="text-xs text-red-600/70">Quitter votre session</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Navigation - Separate row, ONLY on mobile */}
        <div className="md:hidden border-t border-border">
          <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            <button 
              className={`px-4 py-2.5 text-sm font-semibold transition-all rounded-xl whitespace-nowrap ${
                activeTab === 'services'
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('services')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Services</span>
              </div>
            </button>
            <button 
              className={`px-4 py-2.5 text-sm font-semibold transition-all rounded-xl whitespace-nowrap ${
                activeTab === 'messagerie'
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('messagerie')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Messagerie</span>
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">3</span>
              </div>
            </button>
            <button 
              className={`px-4 py-2.5 text-sm font-semibold transition-all rounded-xl whitespace-nowrap ${
                activeTab === 'paiements'
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('paiements')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Paiements</span>
              </div>
            </button>
            <button 
              className={`px-4 py-2.5 text-sm font-semibold transition-all rounded-xl whitespace-nowrap ${
                activeTab === 'tarifs'
                  ? 'text-primary-foreground bg-primary shadow-lg scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabClick('tarifs')}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v-1m-6 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Tarifs</span>
              </div>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}











