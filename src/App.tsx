/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Instagram, 
  Mail, 
  MapPin, 
  Phone, 
  LayoutGrid, 
  Palette, 
  ChevronRight, 
  ExternalLink,
  Github,
  Linkedin,
  Monitor,
  Camera,
  Video,
  Layers,
  GraduationCap,
  Briefcase,
  Wrench,
  CheckCircle2,
  Menu,
  X,
  Settings2,
  Plus,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, loginWithGoogle, logout } from './lib/firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Types ---

type Theme = 'dark' | 'light' | 'orange' | 'minimal' | 'elegant';
type Layout = 'grid' | 'masonry' | 'list';

interface Project {
  id: string;
  category: 'Social Media' | 'Visual Branding' | 'Videography' | 'Event Branding';
  title: string;
  description: string;
  image: string;
  gallery: string[]; // Added gallery support
  tags: string[];
  link?: string;
  fullDescription?: string;
}

// --- Data ---

const WORK_EXPERIENCE = [
  {
    role: "Head of Creative and Production",
    company: "JNC Resto and Pool",
    period: "Feb 2024 - April 2026",
    description: "Leading creative direction and production operations."
  },
  {
    role: "Creative Freelance",
    company: "Independent / On behalf of company",
    period: "Dec 2024 - Now",
    description: "Diverse client projects focusing on brand identity."
  },
  {
    role: "Content Creator",
    company: "Gedank Cell (gadget retail)",
    period: "Aug 2023 - Jan 2024",
    description: "Optimizing social media engagement through visual content."
  },
  {
    role: "Server",
    company: "Pesenkopi+",
    period: "March 2023 - July 2023",
    description: "Customer-facing role in service industry."
  }
];

const EDUCATION = [
  {
    degree: "Business Administration",
    school: "Open University of Indonesia",
    period: "2024 - On going"
  },
  {
    degree: "Science Major",
    school: "Senior High School 1 Probolinggo",
    period: "2017 - 2020"
  }
];

const SKILLS = [
  "Affinity", "Adobe Photoshop", "Canva", "Capcut", "PowerPoint", "Word", "Excel"
];

const PROJECTS: Project[] = [
  {
    id: '1',
    category: 'Social Media',
    title: 'Post Feed Design',
    description: 'Instagram feed designs combining aesthetics, clarity, and engagement.',
    fullDescription: 'I create Instagram feed designs that combine aesthetics, clarity, and engagement for various types of brands. Focused on creating cohesive narratives that stop the scroll.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=400',
      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=400'
    ],
    tags: ['Aesthetics', 'Engagement', 'Branding'],
    link: 'https://instagram.com'
  },
  {
    id: '2',
    category: 'Social Media',
    title: 'Sport Design Feed',
    description: 'Dynamic sports-themed social media content for various brands.',
    fullDescription: 'Social media feed design for Instagram featuring a diverse range of visual concepts—sports, wellness, and lifestyle brands such as villas.',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c64b52d3?q=80&w=800&auto=format&fit=crop',
    gallery: [],
    tags: ['Sports', 'Dynamic', 'Action'],
    link: 'https://instagram.com'
  },
  {
    id: '3',
    category: 'Visual Branding',
    title: 'Wellness Packaging "Rumatu"',
    description: 'Clean and impactful packaging design for wellness products.',
    fullDescription: 'Presenting visual brand designs through realistic and high-quality mockups to showcase how each identity is applied across various media.',
    image: 'https://images.unsplash.com/photo-1556228578-8c7c2e251b5b?q=80&w=800&auto=format&fit=crop',
    gallery: [],
    tags: ['Packaging', 'Clean', 'Mockup'],
    link: 'https://behance.net'
  },
  {
    id: '4',
    category: 'Visual Branding',
    title: 'Parfume Packaging "Sunset Paradise"',
    description: 'Luxury perfume packaging inspired by natural beauty.',
    fullDescription: 'Bringing brand visuals into real-world context through clean and impactful mockup presentations for premium cosmetic brands.',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
    gallery: [],
    tags: ['Luxury', 'Perfume', 'Design'],
    link: 'https://behance.net'
  },
  {
    id: '5',
    category: 'Event Branding',
    title: 'Karnoverse Identity',
    description: 'Dynamic event branding representing youth creativity and culture.',
    fullDescription: 'Shaping Karnoverse\'s visual identity through dynamic event branding that represents youth creativity and culture, including merch and ticket design.',
    image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=800&auto=format&fit=crop',
    gallery: [],
    tags: ['Youth', 'Culture', 'Jersey'],
    link: 'https://behance.net'
  },
  {
    id: '6',
    category: 'Videography',
    title: 'Video Editing Portfolio',
    description: 'High-quality video edits for brand presence and storytelling.',
    fullDescription: 'Producing refined content and video edits that elevate brand presence through clean, engaging, and impactful visuals for JNC Resto and Pool.',
    image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=800&auto=format&fit=crop',
    gallery: [],
    tags: ['Editing', 'Cinematic', 'Impactful'],
    link: 'https://youtube.com'
  }
];

// --- Components ---

const ThemeCustomizer = ({ 
  currentTheme, 
  setTheme, 
  currentLayout, 
  setLayout,
  user,
  isOwner,
  isEditMode,
  setIsEditMode,
  OWNER_EMAIL
}: { 
  currentTheme: Theme; 
  setTheme: (t: Theme) => void; 
  currentLayout: Layout;
  setLayout: (l: Layout) => void;
  user: User | null;
  isOwner: boolean;
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  OWNER_EMAIL: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fixed right-6 bottom-6 z-50 flex flex-col items-end gap-4`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 mb-0 w-72"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Portfolio Controls
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Auth Section */}
              <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                 {!user ? (
                   <button 
                    onClick={loginWithGoogle}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity"
                   >
                     <LogIn className="w-4 h-4" /> Owner Login
                   </button>
                 ) : (
                   <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-bold truncate">{user.displayName}</p>
                          <p className="text-[8px] opacity-50 truncate">{user.email}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        {isOwner && (
                          <button 
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold border transition-all ${isEditMode ? 'bg-orange-500 text-white border-orange-500' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                          >
                            {isEditMode ? "Exit Edit Mode" : "Turn On Edit"}
                          </button>
                        )}
                        <button 
                          onClick={logout}
                          className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-red-500"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                     </div>
                     {user.email !== OWNER_EMAIL && (
                       <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest text-center mt-1">Guest View Only</p>
                     )}
                   </div>
                 )}
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Color Theme
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dark', label: 'Dark Mode', color: 'bg-zinc-900' },
                    { id: 'elegant', label: 'Elegant', color: 'bg-[#0a0a0a]' },
                    { id: 'light', label: 'Light Mode', color: 'bg-zinc-100' },
                    { id: 'orange', label: 'Vibrant', color: 'bg-orange-500' },
                    { id: 'minimal', label: 'Minimal', color: 'bg-zinc-50' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as Theme)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                        currentTheme === t.id 
                          ? 'border-orange-500 ring-1 ring-orange-500' 
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${t.color}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <LayoutGrid className="w-3 h-3" /> Grid Layout
                </p>
                <div className="flex gap-2">
                  {[
                    { id: 'grid', label: 'Default', icon: LayoutGrid },
                    { id: 'masonry', label: 'Masonry', icon: Layers },
                    { id: 'list', label: 'Feed', icon: Menu }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLayout(l.id as Layout)}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-bold transition-all ${
                        currentLayout === l.id 
                          ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' 
                          : 'border-zinc-200 dark:border-zinc-700 dark:text-zinc-400'
                      }`}
                    >
                      <l.icon className="w-4 h-4" />
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

                <AnimatePresence>
                  {isEditMode && (
                    <motion.div 
                      key="edit-toolbar"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-emerald-500 p-3 rounded-2xl shadow-xl flex items-center gap-3 text-white"
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Editing Live Portfolio</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform ${isEditMode ? 'bg-orange-500 text-white' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'}`}
                >
                  <Settings2 className="w-6 h-6" />
                </button>
              </div>
            );
          };

export default function App() {
  const [theme, setTheme] = useState<Theme>('elegant');
  const [layout, setLayout] = useState<Layout>('grid');
  const [filter, setFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [galleryAssets, setGalleryAssets] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const OWNER_EMAIL = "elmirasandya@gmail.com";
  const isOwner = user?.email === OWNER_EMAIL && user?.emailVerified;
  
  // Experience / Education / Skills State
  const [workExperience, setWorkExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  // Profile State
  const [profile, setProfile] = useState<any>({
    firstName: "Elmira",
    lastName: "Sandya",
    availabilityStatus: "Available for Freelance",
    bio: "I create visuals that are not only aesthetically strong, but also meaningful—turning ideas into impactful brand communication.",
    fullBio: "I am Elmira Sandya, a graphic designer with 3.5+ years of experience. I also work in videography, photography, and video editing, bringing concepts to life through visual storytelling that connects and evolves creatively.",
    expYears: "3.5+",
    projectsCount: "50+",
    location: "Indonesia",
    phone: "+62 812-3488-6555",
    instagram: "@elsandy_arief11",
    linkedin: "elmirasandya",
    email: "elmirasandya@gmail.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
    qrCode: null
  });

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // --- Gallery Assets Loader ---
  useEffect(() => {
    if (!selectedProject) {
      setGalleryAssets([]);
      return;
    }

    const assetsRef = collection(db, 'portfolios/main/projects', selectedProject.id, 'gallery');
    const q = query(assetsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const assets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGalleryAssets(assets);
    }, (err) => handleFirestoreError(err, OperationType.GET, `portfolios/main/projects/${selectedProject.id}/gallery`));

    return () => unsubscribe();
  }, [selectedProject?.id]);

  // --- Firebase Sync ---

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u || u.email !== OWNER_EMAIL) {
        setIsEditMode(false);
      }
    });

    // Real-time listeners
    const portfolioRef = doc(db, 'portfolios', 'main');
    const profileRef = doc(db, 'portfolios/main/profile', 'data');
    const projectsRef = collection(db, 'portfolios/main/projects');
    const expRef = collection(db, 'portfolios/main/experience');
    const eduRef = collection(db, 'portfolios/main/education');

    const unsubscribeProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile((prev: any) => ({ ...prev, ...data }));
        if (data.skills) setSkills(data.skills);
      } else if (auth.currentUser?.email === OWNER_EMAIL && auth.currentUser?.emailVerified) {
        // Seed initial data if missing AND user is owner
        seedInitialProfile();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'portfolios/main/profile/data'));

    const unsubscribeProjects = onSnapshot(query(projectsRef, orderBy('createdAt', 'desc')), (snap) => {
      const projs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
      setProjects(projs);
      if (snap.empty && auth.currentUser?.email === OWNER_EMAIL && auth.currentUser?.emailVerified) {
        seedInitialProjects();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'portfolios/main/projects'));

    const unsubscribeExp = onSnapshot(query(expRef, orderBy('order', 'asc')), (snap) => {
      const exp = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkExperience(exp);
      if (snap.empty && auth.currentUser?.email === OWNER_EMAIL && auth.currentUser?.emailVerified) {
        seedInitialExperience();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'portfolios/main/experience'));

    const unsubscribeEdu = onSnapshot(query(eduRef, orderBy('order', 'asc')), (snap) => {
      const edu = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEducation(edu);
      if (snap.empty && auth.currentUser?.email === OWNER_EMAIL && auth.currentUser?.emailVerified) {
        seedInitialEducation();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'portfolios/main/education'));

    setIsLoading(false);

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribeProjects();
      unsubscribeExp();
      unsubscribeEdu();
    };
  }, []);

  const seedInitialProfile = async () => {
    const profileRef = doc(db, 'portfolios/main/profile', 'data');
    try {
      await setDoc(profileRef, { ...profile, skills: SKILLS });
    } catch (e) { console.error(e); }
  };

  const seedInitialProjects = async () => {
    const batch = writeBatch(db);
    PROJECTS.forEach(p => {
      const ref = doc(collection(db, 'portfolios/main/projects'), p.id);
      batch.set(ref, { ...p, createdAt: new Date().toISOString() });
    });
    try { await batch.commit(); } catch (e) { console.error(e); }
  };

  const seedInitialExperience = async () => {
    const batch = writeBatch(db);
    WORK_EXPERIENCE.forEach((exp, i) => {
      const ref = doc(collection(db, 'portfolios/main/experience'));
      batch.set(ref, { ...exp, order: i });
    });
    try { await batch.commit(); } catch (e) { console.error(e); }
  };

  const seedInitialEducation = async () => {
    const batch = writeBatch(db);
    EDUCATION.forEach((edu, i) => {
      const ref = doc(collection(db, 'portfolios/main/education'));
      batch.set(ref, { ...edu, order: i });
    });
    try { await batch.commit(); } catch (e) { console.error(e); }
  };

  // Helper to handle profile updates
  const updateProfile = async (updates: any) => {
    if (!isOwner) return;
    const profileRef = doc(db, 'portfolios/main/profile', 'data');
    try {
      await updateDoc(profileRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'portfolios/main/profile/data');
    }
  };

  // --- Image Utilities ---

  const compressImage = (file: File, maxWidth = 1000, quality = 0.5): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // Using quality of 0.5 and lower resolution to save space
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper to handle profile upload
  const handleProfileUpload = async (field: 'avatar' | 'qrCode', file: File) => {
    if (!isOwner) return;
    try {
      const compressed = await compressImage(file, field === 'qrCode' ? 400 : 800, 0.6);
      await updateProfile({ [field]: compressed });
    } catch (err) {
      console.error("Compression failed", err);
    }
  };

  // Helper to handle image upload
  const handleImageUpload = async (projectId: string, files: FileList | File | File[], isGallery = false) => {
    if (!isOwner) return;
    const fileArray = files instanceof File ? [files] : Array.from(files);
    const projRef = doc(db, 'portfolios/main/projects', projectId);
    
    for (const file of fileArray) {
      try {
        // High quality for main image, medium for gallery
        const compressed = await compressImage(file, isGallery ? 1200 : 1600, isGallery ? 0.6 : 0.7);
        const proj = projects.find(p => p.id === projectId);
        if (!proj) continue;

        if (isGallery) {
          // No more 1MB limit check here because we use a sub-collection
          const galleryRef = collection(projRef, 'gallery');
          const assetId = String(Date.now() + Math.random());
          await setDoc(doc(galleryRef, assetId), {
            id: assetId,
            url: compressed,
            createdAt: new Date().toISOString()
          });
        } else {
          await updateDoc(projRef, { image: compressed });
          if (selectedProject?.id === projectId) {
            setSelectedProject(prev => prev ? { ...prev, image: compressed } : null);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `portfolios/main/projects/${projectId}`);
      }
    }
  };

  const updateProjectField = async (projectId: string, field: keyof Project, value: any) => {
    if (!isOwner) return;
    const projRef = doc(db, 'portfolios/main/projects', projectId);
    try {
      await updateDoc(projRef, { [field]: value });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portfolios/main/projects/${projectId}`);
    }
  };

  const addNewProject = async () => {
    if (!isOwner) return;
    const newId = String(Date.now());
    const newProject: any = {
      category: filter === 'All' ? 'Social Media' : filter as any,
      title: 'New Project',
      description: 'Project summary description.',
      fullDescription: 'Detailed description of your work.',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
      gallery: [],
      tags: ['Design', 'Creative'],
      createdAt: new Date().toISOString()
    };
    const projRef = doc(db, 'portfolios/main/projects', newId);
    try {
      await setDoc(projRef, newProject);
      setSelectedProject({ id: newId, ...newProject });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'portfolios/main/projects');
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return;
    if (confirm('Delete this project and all its gallery assets?')) {
      const projRef = doc(db, 'portfolios/main/projects', id);
      const galleryRef = collection(projRef, 'gallery');
      
      try {
        // Delete gallery assets first
        const assets = await getDocs(galleryRef);
        const batch = writeBatch(db);
        assets.forEach(asset => {
          batch.delete(doc(galleryRef, asset.id));
        });
        await batch.commit();

        // Delete project doc
        await deleteDoc(projRef);
        if (selectedProject?.id === id) setSelectedProject(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `portfolios/main/projects/${id}`);
      }
    }
  };

  const updateExp = async (id: string, updates: any) => {
    if (!isOwner) return;
    const ref = doc(db, 'portfolios/main/experience', id);
    await updateDoc(ref, updates);
  };

  const addExp = async () => {
    if (!isOwner) return;
    const ref = doc(collection(db, 'portfolios/main/experience'));
    await setDoc(ref, { role: "New Role", company: "Company", period: "2024 - Now", description: "Duties...", order: -Date.now() });
  };

  const deleteExp = async (id: string) => {
    if (!isOwner) return;
    await deleteDoc(doc(db, 'portfolios/main/experience', id));
  };

  const updateEdu = async (id: string, updates: any) => {
    if (!isOwner) return;
    const ref = doc(db, 'portfolios/main/education', id);
    await updateDoc(ref, updates);
  };

  const addEdu = async () => {
    if (!isOwner) return;
    const ref = doc(collection(db, 'portfolios/main/education'));
    await setDoc(ref, { degree: "Degree", school: "Institution", period: "Year - Year", order: -Date.now() });
  };

  const deleteEdu = async (id: string) => {
    if (!isOwner) return;
    await deleteDoc(doc(db, 'portfolios/main/education', id));
  };

  const updateSkills = async (newSkills: string[]) => {
    if (!isOwner) return;
    await updateProfile({ skills: newSkills });
  };

  // --- Theme Classes ---
  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'dark':
        return {
          wrapper: 'bg-zinc-950 text-zinc-300 selection:bg-orange-500/30 selection:text-orange-400',
          heading: 'text-white',
          card: 'bg-zinc-900 border-zinc-800',
          accent: 'text-orange-500',
          button: 'bg-orange-500 hover:bg-orange-400 text-white',
          secondary: 'bg-zinc-800 text-zinc-300'
        };
      case 'light':
        return {
          wrapper: 'bg-zinc-50 text-zinc-600 selection:bg-orange-500/30 selection:text-orange-600',
          heading: 'text-zinc-900',
          card: 'bg-white border-zinc-200 shadow-sm',
          accent: 'text-orange-600',
          button: 'bg-zinc-900 hover:bg-zinc-800 text-white',
          secondary: 'bg-zinc-100 text-zinc-600'
        };
      case 'orange':
        return {
          wrapper: 'bg-orange-50 text-orange-900 selection:bg-orange-500 selection:text-white',
          heading: 'text-orange-950',
          card: 'bg-white border-orange-200 shadow-xl shadow-orange-100',
          accent: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
          secondary: 'bg-orange-100 text-orange-900'
        };
      case 'minimal':
        return {
          wrapper: 'bg-white text-zinc-500 font-sans tracking-tight',
          heading: 'text-black font-medium',
          card: 'bg-transparent border-b border-zinc-100 rounded-none',
          accent: 'text-zinc-900 underline underline-offset-4',
          button: 'bg-black text-white hover:opacity-80',
          secondary: 'bg-zinc-50 text-zinc-500'
        };
      case 'elegant':
        return {
          wrapper: 'bg-[#0a0a0a] text-zinc-400 font-sans selection:bg-zinc-100 selection:text-black',
          heading: 'text-zinc-100 font-serif font-light',
          card: 'bg-[#0f0f0f] border border-zinc-800 rounded-none',
          accent: 'text-zinc-100 border-b border-zinc-700',
          button: 'bg-zinc-100 text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold text-[10px]',
          secondary: 'bg-transparent border border-zinc-800 text-zinc-500 rounded-none'
        };
      default:
        return {};
    }
  }, [theme]);

  const categories = ['All', 'Social Media', 'Visual Branding', 'Videography', 'Event Branding'];
  const filteredProjects = projects.filter(p => filter === 'All' || p.category === filter);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeStyles.wrapper}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 bg-opacity-80 backdrop-blur-md px-6 py-4 flex justify-between items-center max-w-7xl mx-auto transition-all duration-500 ${theme === 'elegant' ? 'border-b border-zinc-800 h-20 px-10' : ''}`}>
        <div className="flex items-center gap-3">
          {theme === 'elegant' && (
            <div className="w-8 h-8 bg-zinc-100 flex items-center justify-center">
              <span className="text-[#0a0a0a] font-bold text-xs">ES</span>
            </div>
          )}
          <div className={`text-xl font-bold tracking-tighter ${themeStyles.heading}`}>
            {theme === 'elegant' ? (
              <div className="flex items-center gap-2">
                {isEditMode ? (
                   <input 
                    className="bg-transparent border-b border-zinc-700 outline-none w-48 text-sm tracking-widest uppercase font-sans font-medium"
                    value={`${profile.firstName} ${profile.lastName}`}
                    onChange={(e) => {
                      const [first, ...rest] = e.target.value.split(" ");
                      updateProfile({ firstName: first, lastName: rest.join(" ") });
                    }}
                   />
                ) : (
                  <span className="text-sm tracking-widest uppercase font-sans font-medium">{profile.firstName} {profile.lastName}</span>
                )}
              </div>
            ) : 'ES.'}
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest">
          {['About', 'Projects', 'Experience', 'Contact'].map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} className="hover:text-orange-500 transition-colors">{link}</a>
          ))}
        </div>
        <button className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${themeStyles.button}`}>Get in Touch</button>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${themeStyles.secondary}`}>
            <span className={`w-2 h-2 rounded-full bg-orange-500 animate-pulse`} />
            {isEditMode ? (
              <input 
                className="bg-transparent border-b border-zinc-700 outline-none w-48"
                value={profile.availabilityStatus}
                onChange={(e) => updateProfile({ availabilityStatus: e.target.value })}
              />
            ) : profile.availabilityStatus}
          </div>
          <h1 className={`text-6xl md:text-8xl font-black leading-none mb-6 ${themeStyles.heading}`}>
            {isEditMode ? (
              <input 
                className="bg-transparent border-b border-zinc-700 outline-none w-full"
                value={profile.firstName}
                onChange={(e) => updateProfile({ firstName: e.target.value })}
              />
            ) : profile.firstName} <br />
            {isEditMode ? (
              <input 
                className={`bg-transparent border-b border-zinc-700 outline-none w-full ${themeStyles.accent}`}
                value={profile.lastName}
                onChange={(e) => updateProfile({ lastName: e.target.value })}
              />
            ) : <span className={themeStyles.accent}>{profile.lastName}</span>}
          </h1>
          {isEditMode ? (
            <textarea 
              className="text-lg md:text-xl max-w-md mb-8 leading-relaxed bg-transparent border border-zinc-700 p-2 rounded w-full h-24 outline-none"
              value={profile.bio}
              onChange={(e) => updateProfile({ bio: e.target.value })}
            />
          ) : (
            <p className="text-lg md:text-xl max-w-md mb-8 leading-relaxed">
              {profile.bio}
            </p>
          )}
          <div className="flex gap-4">
            <a href={`https://instagram.com/${profile.instagram?.replace('@', '')}`} target="_blank" rel="noreferrer">
              <Instagram className="w-5 h-5 cursor-pointer hover:text-orange-500 transition-colors" />
            </a>
            <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noreferrer">
              <Linkedin className="w-5 h-5 cursor-pointer hover:text-orange-500 transition-colors" />
            </a>
            <a href={`mailto:${profile.email}`}>
              <Mail className="w-5 h-5 cursor-pointer hover:text-orange-500 transition-colors" />
            </a>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-square"
        >
          {theme !== 'elegant' && <div className="absolute inset-0 bg-orange-500 rounded-3xl rotate-3 -z-10 translate-x-4 opacity-50" />}
          <div className={`w-full h-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 relative group/avatar ${theme === 'elegant' ? 'rounded-none border border-zinc-800 bg-zinc-900' : 'rounded-3xl bg-zinc-800'}`}>
             <img 
              src={profile.avatar} 
              alt={`${profile.firstName} Profile`} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isEditMode && (
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white mb-2" />
                <span className="text-white text-[10px] font-bold uppercase tracking-widest">Change Photo</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProfileUpload('avatar', file);
                  }}
                />
              </label>
            )}
          </div>
        </motion.div>
      </section>

      {/* About & Stats */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto bg-opacity-50">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <h2 className={`text-3xl font-bold mb-8 flex items-center gap-3 ${themeStyles.heading}`}>
              <Monitor className="w-6 h-6 text-orange-500" /> Professional Bio
            </h2>
            {isEditMode ? (
              <textarea 
                className="text-xl leading-relaxed mb-6 bg-transparent border border-zinc-700 p-4 rounded-xl w-full h-48 outline-none"
                value={profile.fullBio}
                onChange={(e) => updateProfile({ fullBio: e.target.value })}
              />
            ) : (
              <p className="text-xl leading-relaxed mb-6">
                {profile.fullBio}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-6 rounded-2xl ${themeStyles.card} ${theme === 'elegant' ? 'border-zinc-800 px-10' : ''}`}>
              {isEditMode ? (
                <input 
                  className="text-3xl font-black mb-1 bg-transparent border-b border-zinc-700 outline-none w-full"
                  value={profile.expYears}
                  onChange={(e) => updateProfile({ expYears: e.target.value })}
                />
              ) : <div className="text-3xl font-black mb-1">{profile.expYears}</div>}
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Years Exp</div>
            </div>
            <div className={`p-6 rounded-2xl ${themeStyles.card} ${theme === 'elegant' ? 'border-zinc-800 px-10' : ''}`}>
              {isEditMode ? (
                <input 
                  className="text-3xl font-black mb-1 bg-transparent border-b border-zinc-700 outline-none w-full"
                  value={profile.projectsCount}
                  onChange={(e) => updateProfile({ projectsCount: e.target.value })}
                />
              ) : <div className="text-3xl font-black mb-1">{profile.projectsCount}</div>}
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Projects</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className={`text-4xl font-black mb-4 ${themeStyles.heading}`}>Selected Works</h2>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    filter === cat 
                      ? 'bg-orange-500 text-white shadow-lg' 
                      : themeStyles.secondary
                  }`}
                >
                  {cat}
                </button>
              ))}
              {isEditMode && (
                <button 
                  onClick={addNewProject}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-2 hover:bg-emerald-600 transition-all ml-2 shadow-sm"
                >
                  <Plus className="w-3 h-3" /> New Project
                </button>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs uppercase tracking-[0.3em] font-bold opacity-30">Archive {projects.length}</p>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className={`grid gap-8 ${
            layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1'
          }`}>
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`group rounded-3xl overflow-hidden cursor-pointer ${themeStyles.card} shadow-xl hover:shadow-2xl transition-all duration-500`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className={`aspect-[4/3] overflow-hidden relative group/img ${theme === 'elegant' ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                    {isEditMode && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <div className="bg-white text-black p-3 rounded-full flex items-center gap-2 font-bold text-xs shadow-2xl scale-90 group-hover/img:scale-100 transition-transform">
                          <Camera className="w-4 h-4" /> Change Cover
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'elegant' ? 'text-zinc-500' : 'text-orange-500'}`}>{project.category}</span>
                      <div className="flex gap-2">
                        {isEditMode && (
                          <button 
                            onClick={(e) => deleteProject(project.id, e)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                            title="Delete Project"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <h3 className={`text-2xl font-black mb-3 leading-tight ${themeStyles.heading}`}>{project.title}</h3>
                    <p className="text-sm opacity-60 mb-6 leading-relaxed line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${themeStyles.secondary}`}>{tag}</span>
                      ))}
                      {project.tags.length > 3 && <span className="text-[9px] font-black opacity-30 px-1 py-1">+{project.tags.length - 3}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center opacity-20">
               <Layers className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold opacity-40">No projects found in "{filter}"</h3>
              <p className="text-sm opacity-30 max-w-xs mx-auto">Try selecting "All" or starting a new project entry to see it listed here.</p>
              <div className="flex gap-4 justify-center mt-6">
                <button onClick={() => setFilter('All')} className="text-orange-500 font-bold hover:underline px-4 py-2">Reset Filter</button>
                {isEditMode && (
                  <button 
                    onClick={addNewProject} 
                    className="bg-emerald-500 text-white font-bold px-6 py-2 rounded-full hover:bg-emerald-600 transition-all shadow-lg"
                  >
                    Create New Project
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Experience & Education */}
      <section id="experience" className="py-20 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <div className="flex justify-between items-center mb-10">
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${themeStyles.heading}`}>
                <Briefcase className="w-6 h-6 text-orange-500" /> Work History
              </h2>
              {isEditMode && (
                <button 
                  onClick={addExp}
                  className="text-xs font-bold text-emerald-500"
                >
                  + ADD ROLE
                </button>
              )}
            </div>
            <div className="space-y-8">
              {workExperience.map((exp, idx) => (
                <div key={exp.id || idx} className="relative pl-8 before:absolute before:left-0 before:top-2 before:w-1 before:h-full before:bg-orange-500/20 before:rounded-full group/exp">
                  <div className={`absolute left-[-4px] top-2 w-3 h-3 rounded-full bg-orange-500`} />
                  {isEditMode && (
                    <button 
                      onClick={() => deleteExp(exp.id)}
                      className="absolute -left-4 top-8 text-red-500 opacity-0 group-hover/exp:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {isEditMode ? (
                    <div className="space-y-2">
                      <input 
                        className="text-xs font-black text-orange-500 uppercase tracking-widest bg-transparent outline-none border-b border-zinc-800" 
                        value={exp.period} 
                        onChange={e => updateExp(exp.id, { period: e.target.value })}
                      />
                      <input 
                        className={`text-xl font-bold bg-transparent outline-none border-b border-zinc-800 w-full ${themeStyles.heading}`} 
                        value={exp.role} 
                        onChange={e => updateExp(exp.id, { role: e.target.value })}
                      />
                      <input 
                        className="text-sm font-bold opacity-70 bg-transparent outline-none border-b border-zinc-800 w-full" 
                        value={exp.company} 
                        onChange={e => updateExp(exp.id, { company: e.target.value })}
                      />
                      <textarea 
                        className="text-sm opacity-60 leading-relaxed bg-transparent outline-none border border-zinc-800 p-2 rounded w-full h-20" 
                        value={exp.description} 
                        onChange={e => updateExp(exp.id, { description: e.target.value })}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={`text-xs font-black text-orange-500 uppercase tracking-widest mb-1`}>{exp.period}</div>
                      <h3 className={`text-xl font-bold ${themeStyles.heading}`}>{exp.role}</h3>
                      <div className="text-sm font-bold opacity-70 mb-2">{exp.company}</div>
                      <p className="text-sm opacity-60 leading-relaxed">{exp.description}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

        <div className="space-y-12">
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${themeStyles.heading}`}>
                <GraduationCap className="w-6 h-6 text-orange-500" /> Education
              </h2>
              {isEditMode && (
                <button 
                  onClick={addEdu}
                  className="text-xs font-bold text-emerald-500"
                >
                  + ADD EDUCATION
                </button>
              )}
            </div>
            <div className="space-y-6">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className={`p-6 rounded-2xl border ${themeStyles.card} relative group/edu`}>
                  {isEditMode && (
                    <button 
                      onClick={() => deleteEdu(edu.id)}
                      className="absolute top-2 right-2 text-red-500 opacity-0 group-hover/edu:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {isEditMode ? (
                    <div className="space-y-2">
                      <input 
                        className="text-xs font-black text-orange-500 uppercase bg-transparent outline-none border-b border-zinc-800 w-full" 
                        value={edu.period} 
                        onChange={e => updateEdu(edu.id, { period: e.target.value })}
                      />
                      <input 
                        className={`font-bold bg-transparent outline-none border-b border-zinc-800 w-full ${themeStyles.heading}`} 
                        value={edu.degree} 
                        onChange={e => updateEdu(edu.id, { degree: e.target.value })}
                      />
                      <input 
                        className="text-sm opacity-70 bg-transparent outline-none border-b border-zinc-800 w-full" 
                        value={edu.school} 
                        onChange={e => updateEdu(edu.id, { school: e.target.value })}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-black text-orange-500 uppercase mb-1">{edu.period}</div>
                      <h3 className={`font-bold ${themeStyles.heading}`}>{edu.degree}</h3>
                      <div className="text-sm opacity-70">{edu.school}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${themeStyles.heading}`}>
                <Wrench className="w-6 h-6 text-orange-500" /> Software Stack
              </h2>
              {isEditMode && (
                <button 
                  onClick={() => {
                    const skill = prompt("Add skill:");
                    if(skill) updateSkills([...skills, skill]);
                  }}
                  className="text-xs font-bold text-emerald-500"
                >
                  + ADD SKILL
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, idx) => (
                <div key={idx} className={`px-4 py-2 rounded-xl text-sm font-bold border ${themeStyles.card} flex items-center gap-2 group/skill`}>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {isEditMode ? (
                     <input 
                      className="bg-transparent outline-none w-24"
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[idx] = e.target.value;
                        updateSkills(newSkills);
                      }}
                     />
                  ) : <span>{skill}</span>}
                  {isEditMode && (
                    <button onClick={() => updateSkills(skills.filter((_, i) => i !== idx))} className="text-red-500 opacity-0 group-hover/skill:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact" className={`py-20 px-6 border-t ${themeStyles.card} ${theme === 'elegant' ? 'border-zinc-800' : ''}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <h2 className={`text-4xl md:text-6xl font-black mb-6 ${themeStyles.heading}`}>Let's talk <br /> more!</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <MapPin className="w-5 h-5 text-orange-500" />
                {isEditMode ? (
                  <input className="font-bold bg-transparent border-b border-zinc-800 outline-none" value={profile.location} onChange={e => updateProfile({ location: e.target.value })} />
                ) : <span className="font-bold">{profile.location}</span>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Phone className="w-5 h-5 text-orange-500" />
                {isEditMode ? (
                  <input className="font-bold bg-transparent border-b border-zinc-800 outline-none" value={profile.phone} onChange={e => updateProfile({ phone: e.target.value })} />
                ) : <span className="font-bold">{profile.phone}</span>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Instagram className="w-5 h-5 text-orange-500" />
                {isEditMode ? (
                  <input className="font-bold bg-transparent border-b border-zinc-800 outline-none" value={profile.instagram} onChange={e => updateProfile({ instagram: e.target.value })} />
                ) : <span className="font-bold">{profile.instagram}</span>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Linkedin className="w-5 h-5 text-orange-500" />
                {isEditMode ? (
                  <input className="font-bold bg-transparent border-b border-zinc-800 outline-none" value={profile.linkedin} onChange={e => updateProfile({ linkedin: e.target.value })} />
                ) : <span className="font-bold">{profile.linkedin}</span>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Mail className="w-5 h-5 text-orange-500" />
                {isEditMode ? (
                  <input className="font-bold bg-transparent border-b border-zinc-800 outline-none w-full" value={profile.email} onChange={e => updateProfile({ email: e.target.value })} />
                ) : <span className="font-bold">{profile.email}</span>}
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl text-center flex flex-col items-center gap-4 ${themeStyles.card} border-2 border-dashed border-zinc-200 dark:border-zinc-800 group/qr relative`}>
            <div className="w-48 h-48 bg-white p-2 rounded-xl flex items-center justify-center relative overflow-hidden">
              {profile.qrCode ? (
                 <img src={profile.qrCode} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-zinc-900 rounded-lg flex flex-col items-center justify-center text-white p-4">
                  <Instagram className="w-12 h-12 mb-2" />
                  <div className="text-[8px] font-black tracking-widest text-center">PORTFOLIO HISTORY</div>
                </div>
              )}
              {isEditMode && (
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6 text-white mb-2" />
                  <span className="text-white text-[8px] font-bold">UPLOAD QR</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProfileUpload('qrCode', file);
                    }}
                  />
                </label>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Portfolio History</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
          <div>© 2026 Elmira Sandya Portfolio</div>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
          </div>
        </div>
      </footer>

      {/* Customizer */}
      <ThemeCustomizer 
        currentTheme={theme} 
        setTheme={setTheme} 
        currentLayout={layout}
        setLayout={setLayout}
        user={user}
        isOwner={isOwner}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        OWNER_EMAIL={OWNER_EMAIL}
      />

      {/* Edit Mode Toggle */}
      <div className="fixed left-6 bottom-6 z-50">
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
            isEditMode 
              ? 'bg-orange-500 text-white' 
              : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 opacity-50 hover:opacity-100'
          }`}
          title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
        >
          {isEditMode ? <CheckCircle2 className="w-6 h-6" /> : <Settings2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Project Detail Modal / Lightbox */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-7xl w-full max-h-screen flex flex-col items-center gap-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProject(null)} 
                className="absolute top-0 right-0 md:-top-16 md:-right-16 z-[110] p-4 text-white/50 hover:text-white bg-white/5 md:bg-transparent rounded-full transition-all hover:scale-110 active:scale-95"
                title="Close (Esc)"
              >
                <X className="w-10 h-10" />
              </button>
              
              <div className="w-full flex flex-col md:flex-row gap-12 items-start overflow-y-auto pr-2 custom-scrollbar">
                <div className="w-full md:w-2/3 flex flex-col gap-6">
                  {/* Main Image View */}
                  <div className="w-full flex items-center justify-center bg-zinc-900/50 rounded-3xl overflow-hidden min-h-[300px] border border-zinc-800/50 group/main relative">
                    <img 
                      src={selectedProject.image} 
                      alt={selectedProject.title} 
                      className="max-w-full max-h-[75vh] object-contain shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                      referrerPolicy="no-referrer"
                    />
                    {isEditMode && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/main:opacity-100 transition-opacity">
                         <label className="p-3 bg-white text-black rounded-full cursor-pointer hover:bg-zinc-200 transition-colors shadow-xl">
                            <Camera className="w-5 h-5" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files) handleImageUpload(selectedProject.id, files);
                              }}
                            />
                         </label>
                      </div>
                    )}
                  </div>
                  
                  {/* Gallery Section */}
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Gallery Assets</h4>
                      {isEditMode && (
                        <label className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                          <Layers className="w-3.5 h-3.5" />
                          UPLOAD MULTIPLE PHOTOS
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                handleImageUpload(selectedProject.id, files, true);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {galleryAssets.map((asset, i) => (
                         <div key={asset.id} className="aspect-square relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg cursor-zoom-in">
                           <img 
                            src={asset.url} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(asset.url);
                            }}
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 updateProjectField(selectedProject.id, 'image', asset.url);
                                 setSelectedProject(prev => prev ? { ...prev, image: asset.url } : null);
                               }}
                               className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all pointer-events-auto"
                               title="Set as Main Photo"
                             >
                                <Camera className="w-4 h-4" />
                             </button>
                             {isEditMode && (
                               <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const assetRef = doc(db, 'portfolios/main/projects', selectedProject.id, 'gallery', asset.id);
                                  await deleteDoc(assetRef);
                                }}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg pointer-events-auto"
                                title="Remove from Gallery"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                         </div>
                       ))}
                       {isEditMode && galleryAssets.length === 0 && (
                         <div className="col-span-full py-12 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600 gap-3">
                           <Layers className="w-8 h-8 opacity-20" />
                           <p className="text-xs font-bold uppercase tracking-widest opacity-40">Your gallery is empty</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-1/3 flex flex-col sticky top-0">
                  <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${theme === 'elegant' ? 'text-zinc-500' : 'text-orange-500'}`}>
                    Project Preview
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {isEditMode && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold opacity-30 tracking-widest uppercase">Project Category</label>
                        <select 
                          className={`text-xs font-black uppercase tracking-widest bg-zinc-900 border border-zinc-700 w-full outline-none py-2 px-3 rounded-lg ${theme === 'elegant' ? 'text-zinc-500' : 'text-orange-500'}`}
                          value={selectedProject.category}
                          onChange={(e) => updateProjectField(selectedProject.id, 'category', e.target.value)}
                        >
                          {categories.filter(c => c !== 'All').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1">
                      {isEditMode ? (
                        <>
                          <label className="text-[8px] font-bold opacity-30 tracking-widest uppercase">Project Headline</label>
                          <input 
                            className={`text-3xl font-black bg-zinc-900 border border-zinc-700 w-full outline-none py-2 px-3 rounded-lg ${themeStyles.heading}`}
                            value={selectedProject.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedProject(prev => prev ? {...prev, title: val} : null);
                              updateProjectField(selectedProject.id, 'title', val);
                            }}
                          />
                        </>
                      ) : (
                        <h2 className={`text-3xl font-black mb-4 ${themeStyles.heading}`}>{selectedProject.title}</h2>
                      )}
                    </div>
                    {isEditMode && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold opacity-30 tracking-widest uppercase">Short Summary (for Card)</label>
                        <input 
                          className="text-sm bg-zinc-900 border border-zinc-700 w-full outline-none py-2 px-3 rounded-lg opacity-70"
                          value={selectedProject.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedProject(prev => prev ? {...prev, description: val} : null);
                            updateProjectField(selectedProject.id, 'description', val);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {isEditMode ? (
                    <div className="space-y-1 mb-6">
                      <label className="text-[8px] font-bold opacity-30 tracking-widest uppercase">Full Case Study Description</label>
                      <textarea 
                        className="text-base opacity-70 leading-relaxed bg-zinc-900 border border-zinc-700 p-4 rounded-xl w-full h-48 outline-none resize-none"
                        value={selectedProject.fullDescription || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedProject(prev => prev ? {...prev, fullDescription: val} : null);
                          updateProjectField(selectedProject.id, 'fullDescription', val);
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-base opacity-70 mb-6 leading-relaxed">
                      {selectedProject.fullDescription || selectedProject.description}
                    </p>
                  )}
                  
                  <div className="space-y-6 mb-8">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40">Keywords</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tags.map(tag => (
                          <div key={tag} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${themeStyles.card}`}>
                            <span className="text-[10px] font-bold">{tag}</span>
                            {isEditMode && (
                              <button 
                                onClick={() => {
                                  const newTags = selectedProject.tags.filter(t => t !== tag);
                                  setSelectedProject(prev => prev ? {...prev, tags: newTags} : null);
                                  updateProjectField(selectedProject.id, 'tags', newTags);
                                }}
                                className="text-zinc-600 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditMode && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-zinc-700 bg-zinc-900/50">
                            <Plus className="w-3 h-3 text-orange-500" />
                            <input 
                              type="text"
                              placeholder="Add tag..."
                              className="bg-transparent border-none outline-none text-[10px] font-bold w-16 focus:w-24 transition-all"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.currentTarget;
                                  const val = input.value.trim();
                                  if (val && !selectedProject.tags.includes(val)) {
                                    const newTags = [...selectedProject.tags, val];
                                    setSelectedProject(prev => prev ? {...prev, tags: newTags} : null);
                                    updateProjectField(selectedProject.id, 'tags', newTags);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-12 border-t border-zinc-800">
                    <label className={`w-full inline-flex items-center justify-center gap-3 px-8 py-5 rounded-full font-bold transition-all cursor-pointer ${themeStyles.button} group shadow-xl`}>
                      <Camera className="w-5 h-5" />
                      ADD PROJECT ASSET
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            handleImageUpload(selectedProject.id, files, true);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-center opacity-40">Upload to project catalog</p>
                    
                    {isEditMode && (
                      <button 
                        onClick={(e) => deleteProject(selectedProject.id, e as any)}
                        className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 border border-red-500/20 hover:border-red-500/50 rounded-full transition-all"
                      >
                        Delete Entire Project
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox for Gallery Assets */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/98"
            onClick={() => setLightboxImage(null)}
          >
             <button 
                onClick={() => setLightboxImage(null)} 
                className="absolute top-8 right-8 z-10 p-4 text-white/50 hover:text-white"
              >
                <X className="w-10 h-10" />
              </button>
              <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={lightboxImage} 
                className="max-w-full max-h-full object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Scroll Nav for Mobile */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
         {/* Could add a compact mobile nav here if needed */}
      </div>
    </div>
  );
}
