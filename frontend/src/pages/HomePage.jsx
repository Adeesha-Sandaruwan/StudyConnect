import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
    const { user } = useContext(AuthContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'tutor') return '/tutor-dashboard';
        return '/student-dashboard';
    };

    const SUBJECTS = [
        "Mathematics", "Physics", "Computer Science", "Biology", 
        "Chemistry", "Business", "Economics", "Languages",
        "History", "Literature", "Engineering", "Medicine"
    ];

    const SUBJECT_STYLE_CLASSES = [
        'from-sky-100 to-cyan-100 text-cyan-800 border-cyan-200',
        'from-orange-100 to-amber-100 text-amber-800 border-amber-200',
        'from-rose-100 to-pink-100 text-pink-800 border-pink-200',
        'from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200',
    ];

    const HERO_IMAGES = [
        "https://ideogram.ai/assets/image/balanced/response/HnJniNonRbWqdNdhAqHCeA",
        "https://ideogram.ai/assets/image/balanced/response/647i1IedRtqehclVQTxr3w",
        "https://ideogram.ai/assets/image/balanced/response/V6iW_6RRQNGxsHmyrWhpDg",
        "https://ideogram.ai/assets/image/balanced/response/8GGG0Hz_QV2dCsURUlEv1A"
    ];

    const scrollToSection = (sectionId) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(sectionId);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-linear-to-br from-[#eaf4ff] via-[#f2f0ff] to-[#fff6e8] font-sans flex flex-col">
            <style>
                {`
                    html { scroll-behavior: smooth; }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-12px); }
                        100% { transform: translateY(0px); }
                    }
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                    @keyframes pulseGlow {
                        0% { opacity: 0.35; }
                        50% { opacity: 0.7; }
                        100% { opacity: 0.35; }
                    }
                    .pulse-glow {
                        animation: pulseGlow 5s ease-in-out infinite;
                    }
                `}
            </style>

            <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl pulse-glow" />
            <div className="pointer-events-none absolute top-40 -right-20 h-104 w-104 rounded-full bg-fuchsia-200/30 blur-3xl pulse-glow" />
            <div className="pointer-events-none absolute bottom-24 left-1/3 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl pulse-glow" />

            <nav className="fixed top-0 z-50 w-full border-b border-white/50 bg-white/75 shadow-sm backdrop-blur-xl transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        
                        <div 
                            className="text-2xl font-extrabold text-[#5b7cfa] tracking-tight flex items-center gap-3 cursor-pointer"
                            onClick={() => scrollToSection('home')}
                        >
                            <svg className="w-8 h-8 text-[#5b7cfa]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            StudyConnect
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('home')} className="font-bold text-gray-600 hover:text-[#5b7cfa] transition-colors">Home</button>
                            <button onClick={() => scrollToSection('about')} className="font-bold text-gray-600 hover:text-[#5b7cfa] transition-colors">About Us</button>
                            <button onClick={() => scrollToSection('contact')} className="font-bold text-gray-600 hover:text-[#5b7cfa] transition-colors">Contact Us</button>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <Link to={getDashboardLink()} className="bg-linear-to-r from-[#4f7dff] to-[#6d67f8] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:from-[#406de8] hover:to-[#5f57eb] transition-all">
                                    Dashboard →
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 font-bold hover:text-[#5b7cfa] transition-colors">
                                        Log In
                                    </Link>
                                    <Link to="/register" className="bg-linear-to-r from-[#4f7dff] to-[#6d67f8] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:from-[#406de8] hover:to-[#5f57eb] transition-all">
                                        Join as Volunteer
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 focus:outline-none">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full left-0">
                        <div className="px-4 pt-4 pb-6 space-y-4 flex flex-col items-center">
                            <button onClick={() => scrollToSection('home')} className="font-bold text-gray-800 w-full py-2 hover:bg-blue-50 rounded-lg">Home</button>
                            <button onClick={() => scrollToSection('about')} className="font-bold text-gray-800 w-full py-2 hover:bg-blue-50 rounded-lg">About Us</button>
                            <button onClick={() => scrollToSection('contact')} className="font-bold text-gray-800 w-full py-2 hover:bg-blue-50 rounded-lg">Contact Us</button>
                            <div className="w-full border-t border-gray-100 my-2 pt-4 flex flex-col gap-3">
                                {user ? (
                                    <Link to={getDashboardLink()} className="bg-[#5b7cfa] text-white w-full text-center py-3 rounded-xl font-bold">Dashboard →</Link>
                                ) : (
                                    <>
                                        <Link to="/login" className="bg-gray-100 text-gray-800 w-full text-center py-3 rounded-xl font-bold">Log In</Link>
                                        <Link to="/register" className="bg-[#5b7cfa] text-white w-full text-center py-3 rounded-xl font-bold">Join as Volunteer</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <div className="h-20"></div>

            <section id="home" className="flex flex-col lg:flex-row justify-center items-start px-4 sm:px-6 lg:px-12 pt-10 pb-20 lg:pt-16 z-10 relative max-w-7xl mx-auto gap-10 lg:gap-12">
                <div className="flex-1 text-center lg:text-left">
                    <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-linear-to-r from-white to-[#edf4ff] px-5 py-2 text-sm font-extrabold tracking-wide text-[#4e70de] shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        A Community-Driven Volunteer Platform
                    </span>
                    
                    <h1 className="mb-8 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
                        Empowering students through <br className="hidden md:block" />
                        <span className="bg-linear-to-r from-[#3c7df0] to-[#7f62ea] bg-clip-text text-transparent">shared knowledge.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
                        Join our network of dedicated volunteer educators and ambitious learners. Give back by tutoring, ask questions when you are stuck, and build a brighter academic future together for free.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        {user ? (
                            <Link to={getDashboardLink()} className="bg-linear-to-r from-[#4f7dff] to-[#6d67f8] px-8 py-4 rounded-full font-extrabold text-lg text-white shadow-md transition-all hover:from-[#406de8] hover:to-[#5f57eb] text-center">
                                Go to your Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="bg-linear-to-r from-[#4f7dff] to-[#6d67f8] px-8 py-4 rounded-full font-extrabold text-lg text-white shadow-md transition-all hover:from-[#406de8] hover:to-[#5f57eb] text-center">
                                    Become a Volunteer
                                </Link>
                                <button onClick={() => scrollToSection('about')} className="rounded-full border-2 border-cyan-200 bg-white/90 px-8 py-4 text-center text-lg font-extrabold text-cyan-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50">
                                    Discover More
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 w-full max-w-2xl lg:pt-6">
                    <div className="grid grid-cols-2 gap-4 h-96 sm:h-112 lg:h-125">
                        <div className="flex flex-col gap-4">
                            <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border-4 border-white animate-float" style={{ animationDelay: '0s' }}>
                                <img src={HERO_IMAGES[0]} alt="Volunteer Tutoring" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border-4 border-white animate-float" style={{ animationDelay: '2s' }}>
                                <img src={HERO_IMAGES[1]} alt="Community Learning" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 pt-8">
                            <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border-4 border-white animate-float" style={{ animationDelay: '1s' }}>
                                <img src={HERO_IMAGES[2]} alt="Online Education" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border-4 border-white animate-float" style={{ animationDelay: '3s' }}>
                                <img src={HERO_IMAGES[3]} alt="Student Success" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="border-y border-white/60 bg-white/80 py-16 shadow-sm backdrop-blur px-4">
                <div className="max-w-7xl mx-auto">
                    <p className="mb-10 text-center text-sm font-extrabold uppercase tracking-widest text-gray-500">Volunteers available across diverse fields</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {SUBJECTS.map((subject, idx) => (
                            <div key={idx} className={`cursor-default rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 ${SUBJECT_STYLE_CLASSES[idx % SUBJECT_STYLE_CLASSES.length]}`}>
                                {subject}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <section id="about" className="scroll-mt-20 max-w-7xl mx-auto px-4 py-32 sm:px-6 lg:px-8">
                <div className="text-center mb-20 max-w-4xl mx-auto">
                    <span className="mb-4 block text-sm font-extrabold uppercase tracking-widest text-[#4e70de]">Our Mission</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">Education should be accessible to everyone.</h2>
                    <p className="text-gray-500 text-xl leading-relaxed">
                        StudyConnect operates entirely on the generosity of volunteer experts and the curiosity of driven students. 
                        We ensure quality through verified profiles and community moderation, creating a safe harbor where academic support is always free and reliable.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="group rounded-3xl border border-cyan-100 bg-linear-to-br from-white to-cyan-50 p-10 shadow-sm transition-all hover:-translate-y-1 hover:border-cyan-200 hover:shadow-md">
                        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 transition-transform duration-300 group-hover:scale-110">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Collaborative Q&A</h3>
                        <p className="text-gray-500 leading-relaxed text-lg">Post challenging questions, attach your study materials, and let our community of volunteers break down the solutions step-by-step.</p>
                    </div>
                    
                    <div className="group rounded-3xl border border-amber-100 bg-linear-to-br from-white to-amber-50 p-10 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-200 hover:shadow-md">
                        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 transition-transform duration-300 group-hover:scale-110">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Verified Volunteers</h3>
                        <p className="text-gray-500 leading-relaxed text-lg">To protect the integrity of our platform, all volunteer tutors undergo an administrative verification process to ensure high-quality mentorship.</p>
                    </div>
                    
                    <div className="group rounded-3xl border border-rose-100 bg-linear-to-br from-white to-rose-50 p-10 shadow-sm transition-all hover:-translate-y-1 hover:border-rose-200 hover:shadow-md">
                        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 transition-transform duration-300 group-hover:scale-110">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Real-Time Impact</h3>
                        <p className="text-gray-500 leading-relaxed text-lg">Whether you are giving or receiving help, stay engaged with instant notifications whenever your posts are answered or upvoted.</p>
                    </div>
                </div>
            </section>

            <section id="contact" className="scroll-mt-20 border-t border-white/60 bg-white/80 py-32 backdrop-blur">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="mb-4 block text-sm font-extrabold uppercase tracking-widest text-[#4e70de]">Contact Support</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">Ready to get involved?</h2>
                    <p className="text-gray-500 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                        Whether you want to apply as a verified volunteer, need technical assistance, or have partnership inquiries, our administration team is here to help you.
                    </p>
                    
                    <a 
                        href="mailto:support@studyconnect.edu" 
                        className="group inline-flex items-center gap-4 rounded-3xl border-2 border-[#d8e3ff] bg-linear-to-r from-white to-[#edf4ff] px-10 py-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#5b7cfa] hover:shadow-md"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#5b7cfa] to-[#7a66f3] text-white">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <span className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Email Administration</span>
                            <span className="block text-2xl font-extrabold text-gray-800 group-hover:text-[#5b7cfa] transition-colors">support@studyconnect.edu</span>
                        </div>
                    </a>
                </div>
            </section>

            <footer className="bg-gray-900 text-white py-16 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div>
                        <div className="text-3xl font-extrabold text-[#5b7cfa] tracking-tight mb-3">StudyConnect</div>
                        <p className="text-gray-400 font-medium text-base max-w-sm">A dedicated volunteer platform connecting verified educators with eager students worldwide.</p>
                    </div>
                    <div className="flex gap-8">
                        <button onClick={() => scrollToSection('home')} className="text-gray-400 hover:text-white font-bold text-sm transition-colors">Home</button>
                        <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-white font-bold text-sm transition-colors">About Us</button>
                        <button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-white font-bold text-sm transition-colors">Contact Support</button>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm font-bold">
                    © {new Date().getFullYear()} StudyConnect Volunteer Initiative. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default HomePage;