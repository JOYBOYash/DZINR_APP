import React, { useState, useEffect } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "./services/firebase";
import { authService } from "./services/auth.service";
import { userService } from "./services/user.service";
import { useAuthStore } from "./stores/auth.store";
import { useOnboardingStore } from "./stores/onboarding.store";
import { useToastStore } from "./stores/toast.store";
import { ProfileSetupFlow } from "./components/ProfileSetupFlow";
import { LoadingState } from "./components/LoadingState";
import { DashboardView } from "./components/DashboardView";
import { ProjectsView } from "./components/ProjectsView";
import { ProjectEditorView } from "./components/ProjectEditorView";
import { EditProfileView } from "./components/EditProfileView";
import { DiscoveryFeedView } from "./components/DiscoveryFeedView";
import { AuthWrapper } from "./components/AuthWrapper";
import { ToastContainer } from "./components/Toast";
import { NavBar } from "./components/NavBar";
import { Header } from "./components/Header";
import { LogoutConfirmModal } from "./components/LogoutConfirmModal";
import { PWAInstallPopup } from "./components/PWAInstallPopup";
import { SplashScreen } from "./components/SplashScreen";
import { getFriendlyAuthError } from "./utils/auth-errors";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const {
    user,
    firebaseUser,
    loading,
    onboardingRequired,
    error,
    setUser,
    setFirebaseUser,
    setLoading,
    setOnboardingRequired,
    setError,
    reset,
  } = useAuthStore();

  const onboardingStore = useOnboardingStore();
  const { toasts, removeToast } = useToastStore();
  const queryClient = useQueryClient();

  // Navigation states
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState<"feed" | "profile" | "projects" | "edit-profile" | "project-editor">(
    "feed",
  );
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [loadingMessage, setLoadingMessage] =
    useState<string>("Authenticating");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Theme settings ('dark' | 'light')
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("dzinr_theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  // Sync theme to document element and body element to prevent white overscroll bands
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
      document.body.style.backgroundColor = "#4A0517";
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
      document.body.style.backgroundColor = "#FFFFFF";
    }
  }, [theme]);

  // Persisted last logged-in user state
  const [lastUser, setLastUser] = useState<any>(() => {
    const saved = localStorage.getItem("dzinr_last_user");
    return saved ? JSON.parse(saved) : null;
  });

  // PWA Prompt status
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showPostLoginInstallPopup, setShowPostLoginInstallPopup] =
    useState(false);
  const [showRetryLoginPopup, setShowRetryLoginPopup] = useState(false);
  const [retryLoginErrorMessage, setRetryLoginErrorMessage] = useState<
    string | null
  >(null);

  // Splash Screen Timeout (lasting 6.5 seconds with animation)
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 6500);
    return () => clearTimeout(splashTimer);
  }, []);

  // Monitor Auth Status changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setLoadingMessage(
            `Logging in as ${fbUser.displayName || fbUser.email || "User"}`,
          );
          setLoading(true);

          // Force fresh user metadata reload from Firebase Authentication
          try {
            await fbUser.reload();
          } catch (rErr) {
            console.warn("Could not reload fbUser metadata:", rErr);
          }
          const reloadedFbUser = auth.currentUser || fbUser;
          setFirebaseUser(reloadedFbUser);

          const isVerified = reloadedFbUser.emailVerified;
          const lastSignInTime = reloadedFbUser.metadata.lastSignInTime || reloadedFbUser.metadata.creationTime || new Date().toISOString();
          const lastLoginMs = new Date(lastSignInTime).getTime();
          const elapsedMs = Date.now() - lastLoginMs;
          const seventyTwoHoursMs = 72 * 60 * 60 * 1000;

          // If NOT verified, and they logged in more than 72 hours ago, execute auto-deletion
          if (!isVerified && elapsedMs > seventyTwoHoursMs) {
            const email = reloadedFbUser.email || "";
            const userId = reloadedFbUser.uid;
            
            setLoadingMessage("Grace period expired. Deleting unverified account...");
            
            // Delete Firestore profile and add to deleted collection
            await userService.deleteAccount(userId, email);
            
            // Clear last user stored session
            localStorage.removeItem("dzinr_last_user");
            setLastUser(null);
            
            // Attempt standard Firebase Auth user deletion client-side and server-side
            try {
              await fetch('/api/auth/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: userId })
              });
              await reloadedFbUser.delete();
            } catch (authDelErr) {
              console.warn("Could not delete Auth user client-side (re-authentication might be required):", authDelErr);
            }
            
            await authService.logout();
            reset();
            useToastStore.getState().showToast(
              "Your account was permanently deleted because email verification was not completed within the 72-hour grace period.",
              "error"
            );
            setLoading(false);
            return;
          }

          // If NOT verified and within grace period, auto-trigger a real verification email once per session
          if (!isVerified) {
            const hasSentInSession = sessionStorage.getItem(`dzinr_verify_sent_${reloadedFbUser.uid}`);
            if (!hasSentInSession) {
              if (reloadedFbUser.email) {
                await authService.sendCustomVerificationEmail(reloadedFbUser.email).catch((e) => {
                  console.warn("Failed to auto-send verification email:", e);
                });
              }
              sessionStorage.setItem(`dzinr_verify_sent_${reloadedFbUser.uid}`, "true");
            }
          }

          // Look up user document in Firestore users collection
          const profile = await userService.getUserProfile(reloadedFbUser.uid);
          if (profile) {
            // Synchronize verification state to Firestore for both new and existing users
            if (profile.emailVerified !== isVerified) {
              await userService.updateUserProfile(reloadedFbUser.uid, { emailVerified: isVerified });
              profile.emailVerified = isVerified;
            }

            setUser(profile);
            setOnboardingRequired(false);
            onboardingStore.clearOnboarding();

            const profileToSave = {
              username: profile.username,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
              id: profile.id,
              providerId: reloadedFbUser.providerData[0]?.providerId || "password",
            };
            localStorage.setItem(
              "dzinr_last_user",
              JSON.stringify(profileToSave),
            );
            setLastUser(profileToSave);
          } else {
            // Profile does not exist yet. Create a profile using onboarding store answers or sensible defaults!
            const oStore = useOnboardingStore.getState();
            await handleSyncOnboardingWithFirestore(reloadedFbUser, oStore);
          }
        } else {
          reset();
          const saved = localStorage.getItem("dzinr_last_user");
          if (!saved) {
            setLastUser(null);
          }
        }
      } catch (err: any) {
        console.error("Auth status listener check error:", err);
        setError(getFriendlyAuthError(err));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Monitor Google redirect results for errors/successes
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        // Automatically handled by authStateListener above
      })
      .catch((err) => {
        console.warn(
          "Google Redirect auth error or cancellation detected:",
          err,
        );
      });
  }, []);

  // Monitor URL parameters for Firebase Action Codes (email verification)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");
    
    if (mode === "verifyEmail" && oobCode) {
      setLoading(true);
      setLoadingMessage("Verifying your email address...");
      authService.verifyEmailCode(oobCode)
        .then(() => {
          useToastStore.getState().showToast("Email verified successfully! Welcome onboard.", "success");
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          // If user is already logged in, their reload will catch it next time or they can click the check button
        })
        .catch((err) => {
          console.error("Email verification failed:", err);
          useToastStore.getState().showToast("Email verification link is invalid or has expired.", "error");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // Monitor PWA installation hooks
  useEffect(() => {
    const catchPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", catchPrompt);

    const onAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", catchPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // Trigger PWA install popup after logging in if they haven't installed yet
  useEffect(() => {
    const isUserAuth = !!firebaseUser && !!user && !onboardingRequired;
    if (isUserAuth && !isPwaInstalled) {
      const dismissed =
        localStorage.getItem("dzinr_pwa_install_popup_dismissed") === "true";
      if (!dismissed) {
        const isMobile =
          typeof window !== "undefined" &&
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );
        if (deferredPrompt || isMobile) {
          const timer = setTimeout(() => {
            setShowPostLoginInstallPopup(true);
          }, 1500); // 1.5 seconds delay so they land on dashboard nicely first
          return () => clearTimeout(timer);
        }
      }
    } else {
      setShowPostLoginInstallPopup(false);
    }
  }, [firebaseUser, user, onboardingRequired, isPwaInstalled, deferredPrompt]);

  // Create profile and save onboarding options to Firestore
  const handleSyncOnboardingWithFirestore = async (
    fbUser: any,
    oStore: any,
  ) => {
    try {
      const cleanUsername = (
        fbUser.displayName ||
        fbUser.email?.split("@")[0] ||
        "designer"
      )
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 25);

      // Ensure unique username
      let usernameToCheck = cleanUsername;
      const isTaken = await userService.isUsernameTaken(usernameToCheck);
      if (isTaken) {
        usernameToCheck = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const newProfile = {
        id: fbUser.uid,
        email: fbUser.email || "",
        username: usernameToCheck,
        bio: "",
        avatarUrl: fbUser.photoURL || "",
        role: oStore.role || "Brand Designer",
        inspirationStyles: oStore.inspirationStyles || [],
        preferredFormats: oStore.preferredFormats || [],
        goals: oStore.goals || [],
        discoverySource: oStore.discoverySource || "Google Search",
        onboardingCompleted: true,
        profileCompleted: false,
        portfolioUrl: null,
        emailVerified: firebaseUser?.emailVerified || false,
        integrations: {},
        stats: {
          uploadsCount: 0,
          draftCount: 0,
          publishedCount: 0
        },
        createdAt: new Date().toISOString(),
      };

      await userService.createUserProfile(newProfile);

      setUser(newProfile);
      setOnboardingRequired(false);
      oStore.clearOnboarding();

      const profileToSave = {
        username: newProfile.username,
        email: newProfile.email,
        avatarUrl: newProfile.avatarUrl,
        id: newProfile.id,
        providerId: fbUser.providerData[0]?.providerId || "password",
      };
      localStorage.setItem("dzinr_last_user", JSON.stringify(profileToSave));
      setLastUser(profileToSave);
    } catch (err: any) {
      console.error("Onboarding profile write failed:", err);
      setError(getFriendlyAuthError(err));
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("dzinr_theme", next);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      setLoadingMessage(
        `Logging out as ${user?.username || firebaseUser?.email || "User"}`,
      );
      setLoading(true);
      await authService.logout();
    } catch (err: any) {
      console.error("Logout runtime failure:", err);
    } finally {
      setLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // 1. SPLASH SCREEN (Lasts for 5-8 seconds)
  if (showSplash) {
    return <SplashScreen show={showSplash} />;
  }

  // Pre-load verification loader
  if (loading) {
    return (
      <LoadingState
        id="application-preflight-loader"
        message={loadingMessage}
        theme={theme}
      />
    );
  }

  // DETERMINING WORKSPACE SCREEN VIEW
  const isAuthenticated = !!firebaseUser && !!user && !onboardingRequired;
  const isFullyAuthenticated = isAuthenticated && user?.profileCompleted;
  const showNav = isFullyAuthenticated && currentPage !== "edit-profile" && currentPage !== "project-editor";

  return (
    <div
      id="app-root-theme-container"
      className={`min-h-screen relative flex flex-col transition-colors duration-300 font-sans ${
        theme === "dark"
          ? "dark bg-[#4A0517] text-white"
          : "bg-[#FFFFFF] text-[#171717]"
      }`}
    >
      {/* 1. HEADER Segment (Sidebar on desktop if authenticated) */}
      <Header
        isAuthenticated={showNav}
        theme={theme}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        toggleTheme={toggleTheme}
        setShowLogoutConfirm={setShowLogoutConfirm}
        firebaseUser={firebaseUser}
      />

      {/* MOBILE BOTTOM NAVIGATION */}
      {showNav && (
        <NavBar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          theme={theme}
        />
      )}

      {/* 2. MAIN LAYOUT CONTAINER */}
      <main
        className={`flex-1 w-full relative z-10 flex flex-col ${
          showNav
            ? "max-w-[1400px] mx-auto px-4 md:px-12 py-6 pb-24 md:pb-6 md:pl-[120px] items-center" // Extra padding for sidebar on desktop
            : "px-0 py-0 w-full max-w-none items-start"
        }`}
      >
        <AuthWrapper
          isAuthenticated={isAuthenticated}
          theme={theme}
          lastUser={lastUser}
          toggleTheme={toggleTheme}
          deferredPrompt={deferredPrompt}
          isPwaInstalled={isPwaInstalled}
          installApp={installApp}
        >
          {/* VIEW A: AUTHENTICATED USER HOME DASHBOARD OR PROFILE SETUP FLOW */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center"
            >
              {user && !user.profileCompleted ? (
                <ProfileSetupFlow
                  user={user}
                  theme={theme}
                  onComplete={(updatedUser) => {
                    setUser(updatedUser);
                  }}
                />
              ) : currentPage === "projects" ? (
                <ProjectsView
                  user={user!}
                  theme={theme}
                  onEditDraft={(id) => {
                    setEditingProjectId(id);
                    setCurrentPage("project-editor");
                  }}
                  onCreateNew={() => {
                    setEditingProjectId(null);
                    setCurrentPage("project-editor");
                  }}
                />
              ) : currentPage === "project-editor" ? (
                <ProjectEditorView
                  user={user!}
                  theme={theme}
                  initialDraftId={editingProjectId}
                  onBack={() => setCurrentPage("projects")}
                />
              ) : currentPage === "edit-profile" ? (
                <EditProfileView
                  user={user!}
                  theme={theme}
                  onClose={() => setCurrentPage("profile")}
                />
              ) : currentPage === "feed" ? (
                <DiscoveryFeedView
                  user={user!}
                  theme={theme}
                  onExploreCategories={() => setCurrentPage("projects")}
                  onRefreshStats={() => {
                    queryClient.invalidateQueries({ queryKey: ["creatorMetrics", user?.id] });
                  }}
                />
              ) : (
                <DashboardView
                  user={user!}
                  firebaseUser={firebaseUser}
                  theme={theme}
                  deferredPrompt={deferredPrompt}
                  installApp={installApp}
                  onViewAllProjects={() => setCurrentPage("projects")}
                  onEditProfile={() => setCurrentPage("edit-profile")}
                  onLogout={() => setShowLogoutConfirm(true)}
                  onToggleTheme={toggleTheme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </AuthWrapper>
      </main>

      {/* 3. LOGOUT CONFIRMATION MODAL OVERLAY */}
      <LogoutConfirmModal
        show={showLogoutConfirm}
        theme={theme}
        user={user}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <PWAInstallPopup
        show={showPostLoginInstallPopup}
        theme={theme}
        deferredPrompt={deferredPrompt}
        onInstall={() => {
          installApp();
          setShowPostLoginInstallPopup(false);
        }}
        onDismiss={() => {
          setShowPostLoginInstallPopup(false);
          localStorage.setItem("dzinr_pwa_install_popup_dismissed", "true");
        }}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
