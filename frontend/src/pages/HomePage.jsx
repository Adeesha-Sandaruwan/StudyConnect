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
        <div className="min-h-screen bg-[#eef2f6] font-sans overflow-x-hidden flex flex-col">
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
                `}
            </style>

            <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm z-50 transition-all">
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
                                <Link to={getDashboardLink()} className="bg-[#5b7cfa] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-[#4a6be0] transition-all">
                                    Dashboard →
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 font-bold hover:text-[#5b7cfa] transition-colors">
                                        Log In
                                    </Link>
                                    <Link to="/register" className="bg-[#5b7cfa] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-[#4a6be0] transition-all">
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

            <section id="home" className="flex flex-col lg:flex-row justify-center items-center px-4 sm:px-6 lg:px-12 pt-16 pb-24 lg:pt-32 z-10 relative max-w-7xl mx-auto gap-12">
                <div className="flex-1 text-center lg:text-left">
                    <span className="inline-flex items-center gap-2 bg-white text-[#5b7cfa] px-5 py-2 rounded-full text-sm font-extrabold tracking-wide mb-8 shadow-sm border border-blue-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        A Community-Driven Volunteer Platform
                    </span>
                    
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
                        Empowering students through <br className="hidden md:block" />
                        <span className="text-[#5b7cfa]">shared knowledge.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
                        Join our network of dedicated volunteer educators and ambitious learners. Give back by tutoring, ask questions when you are stuck, and build a brighter academic future together for free.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        {user ? (
                            <Link to={getDashboardLink()} className="bg-[#5b7cfa] text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-md hover:bg-[#4a6be0] transition-colors text-center">
                                Go to your Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="bg-[#5b7cfa] text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-md hover:bg-[#4a6be0] transition-colors text-center">
                                    Become a Volunteer
                                </Link>
                                <button onClick={() => scrollToSection('about')} className="bg-white text-gray-800 border-2 border-gray-200 px-8 py-4 rounded-full font-extrabold text-lg hover:border-[#5b7cfa] hover:text-[#5b7cfa] transition-colors text-center">
                                    Discover More
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 w-full max-w-2xl">
                    <div className="grid grid-cols-2 gap-4 h-[400px] sm:h-[500px]">
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

            <div className="bg-white py-16 border-y border-gray-100 shadow-sm px-4">
                <div className="max-w-7xl mx-auto">
                    <p className="text-center text-sm font-extrabold text-gray-400 uppercase tracking-widest mb-10">Volunteers available across diverse fields</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {SUBJECTS.map((subject, idx) => (
                            <div key={idx} className="bg-[#f8fafc] border border-gray-100 text-gray-700 px-6 py-3 rounded-full font-bold text-sm shadow-sm transition-colors hover:border-[#5b7cfa] hover:text-[#5b7cfa] cursor-default">
                                {subject}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 scroll-mt-20">
                <div className="text-center mb-20 max-w-4xl mx-auto">
                    <span className="text-[#5b7cfa] font-extrabold uppercase tracking-widest text-sm block mb-4">Our Mission</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">Education should be accessible to everyone.</h2>
                    <p className="text-gray-500 text-xl leading-relaxed">
                        StudyConnect operates entirely on the generosity of volunteer experts and the curiosity of driven students. 
                        We ensure quality through verified profiles and community moderation, creating a safe harbor where academic support is always free and reliable.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-blue-50 text-[#5b7cfa] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Collaborative Q&A</h3>
                        <p className="text-gray-500 leading-relaxed text-lg">Post challenging questions, attach your study materials, and let our community of volunteers break down the solutions step-by-step.</p>
                    </div>
                    
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:border-purple-100 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Verified Volunteers</h3>
                        <p className="text-gray-500 leading-relaxed text-lg">To protect the integrity of our platform, all volunteer tutors undergo an administrative verification process to ensure high-quality mentorship.</p>
                    </div>
                    
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:border-green-100 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Real-Time Impact</h3>
                        <p className="text-gray-500 leading-relaxed text-lg">Whether you are giving or receiving help, stay engaged with instant notifications whenever your posts are answered or upvoted.</p>
                    </div>
                </div>
            </section>

            <section id="contact" className="bg-white py-32 border-t border-gray-100 scroll-mt-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="text-[#5b7cfa] font-extrabold uppercase tracking-widest text-sm block mb-4">Contact Support</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">Ready to get involved?</h2>
                    <p className="text-gray-500 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                        Whether you want to apply as a verified volunteer, need technical assistance, or have partnership inquiries, our administration team is here to help you.
                    </p>
                    
                    <a 
                        href="mailto:support@studyconnect.edu" 
                        className="inline-flex items-center gap-4 bg-[#f8fafc] border-2 border-gray-100 hover:border-[#5b7cfa] px-10 py-6 rounded-3xl transition-all group shadow-sm hover:shadow-md hover:-translate-y-1"
                    >
                        <div className="w-14 h-14 bg-[#5b7cfa] text-white rounded-2xl flex items-center justify-center">
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