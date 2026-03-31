import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
    const { user } = useContext(AuthContext);

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'tutor') return '/tutor-dashboard';
        return '/student-dashboard';
    };

    const SUBJECTS = [
        "Mathematics", "Physics", "Computer Science", "Biology", 
        "Chemistry", "Business", "Economics", "Languages",
        "Mathematics", "Physics", "Computer Science", "Biology" // Duplicated for seamless scrolling
    ];

    return (
        <div className="min-h-screen bg-[#eef2f6] font-sans overflow-x-hidden flex flex-col">
            {/* Embedded CSS for custom animations */}
            <style>
                {`
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: flex;
                        width: 200%;
                        animation: scroll 20s linear infinite;
                    }
                    .animate-marquee:hover {
                        animation-play-state: paused;
                    }
                `}
            </style>

            {/* Landing Page Navigation (Only visible if logged out, as App NavBar handles logged in) */}
            {!user && (
                <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50">
                    <div className="text-2xl font-extrabold text-[#5b7cfa] tracking-tight flex items-center gap-2">
                        <span className="text-3xl">📚</span> StudyConnect
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-gray-600 font-bold hover:text-[#5b7cfa] transition-colors hidden sm:block">
                            Sign In
                        </Link>
                        <Link to="/register" className="bg-[#5b7cfa] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-[#4a6be0] hover:-translate-y-0.5 transition-all">
                            Get Started
                        </Link>
                    </div>
                </nav>
            )}

            {/* Hero Section */}
            <main className="flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-12 pb-20 lg:pt-24 z-10 relative">
                
                {/* Decorative background blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5b7cfa]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

                <span className="inline-block bg-white text-[#5b7cfa] px-4 py-1.5 rounded-full text-sm font-extrabold tracking-wide mb-6 shadow-sm border border-blue-50 relative z-10">
                    🚀 The Ultimate Collaborative Learning Platform
                </span>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight max-w-4xl leading-tight relative z-10">
                    Master your studies, <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b7cfa] to-purple-500">together.</span>
                </h1>
                
                <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl relative z-10">
                    Connect with peers, get answers from verified tutors, share your progress, and stay organized in one powerful platform.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4 relative z-10">
                    {user ? (
                        <Link to={getDashboardLink()} className="bg-[#5b7cfa] text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-xl hover:bg-[#4a6be0] hover:-translate-y-1 transition-all">
                            Go to your Dashboard →
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" className="bg-[#5b7cfa] text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-xl hover:bg-[#4a6be0] hover:-translate-y-1 transition-all">
                                Join for Free
                            </Link>
                            <Link to="/login" className="bg-white text-gray-800 border-2 border-gray-100 px-8 py-4 rounded-full font-extrabold text-lg shadow-sm hover:border-[#5b7cfa] hover:text-[#5b7cfa] hover:-translate-y-1 transition-all">
                                Log In
                            </Link>
                        </>
                    )}
                </div>
            </main>

            {/* Animated Marquee Carousel Section */}
            <section className="bg-white py-10 border-y border-gray-100 overflow-hidden relative">
                <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10"></div>
                
                <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Find help in any subject</p>
                
                <div className="animate-marquee gap-8 items-center">
                    {SUBJECTS.map((subject, idx) => (
                        <div key={idx} className="flex items-center justify-center bg-[#eef2f6] text-gray-700 px-8 py-3 rounded-2xl font-bold whitespace-nowrap shadow-sm">
                            {subject}
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Everything you need to succeed</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                        <div className="w-14 h-14 bg-blue-50 text-[#5b7cfa] rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            📝
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-3">Study Posts & Q&A</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Stuck on a problem? Post it to the feed with images or PDFs. Get upvotes, answers, and collaborate in real-time.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                        <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            🎓
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-3">Verified Tutors</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Trust the answers you receive. Our admin-verified tutors and strictly moderated community ensure high-quality learning.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                        <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                            🔔
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-3">Instant Notifications</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Never miss an update. Get instantly notified when someone upvotes your post or provides an answer to your questions.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xl font-extrabold text-[#5b7cfa] tracking-tight">StudyConnect</div>
                    <p className="text-gray-400 font-medium text-sm">© {new Date().getFullYear()} StudyConnect. Built for seamless learning.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;