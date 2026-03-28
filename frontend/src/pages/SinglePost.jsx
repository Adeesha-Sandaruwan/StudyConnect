import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const SinglePost = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        setIsLoading(true);
        try {
            // FIX: Pointing exactly to your backend's mount path
            const res = await api.get(`/studyposts/${id}`);
            setPost(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load the study post. It may have been deleted.');
        } finally {
            setIsLoading(false);
        }
    };

    const nextMedia = () => {
        setCurrentMediaIndex((prev) => (prev === post.media.length - 1 ? 0 : prev + 1));
    };

    const prevMedia = () => {
        setCurrentMediaIndex((prev) => (prev === 0 ? post.media.length - 1 : prev - 1));
    };

    const isPdf = (url) => url?.toLowerCase().includes('.pdf');

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-3xl mx-auto p-8 mt-12 bg-white rounded-3xl shadow-sm text-center">
                <span className="text-5xl mb-4 block">🚫</span>
                <h2 className="text-2xl font-bold text-gray-800">{error || 'Post not found'}</h2>
                <button onClick={() => navigate('/posts')} className="mt-6 bg-[#5b7cfa] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#4a6be0]">
                    ← Back to Feed
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-sans pb-24">
            
            <button onClick={() => navigate('/posts')} className="text-sm font-bold text-gray-500 hover:text-[#5b7cfa] flex items-center gap-2 mb-6 transition-colors">
                <span>←</span> Back to Feed
            </button>

            <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-8 border border-white hover:border-blue-50 transition-colors">
                
                <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {post.user?.avatar ? (
                            <img src={post.user.avatar} alt="avatar" className="w-14 h-14 rounded-full object-cover shadow-sm" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-[#5b7cfa]/10 flex items-center justify-center text-[#5b7cfa] font-extrabold text-xl">
                                {post.user?.name?.charAt(0) || '?'}
                            </div>
                        )}
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-lg leading-tight">{post.user?.name || 'Unknown User'}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${post.user?.role === 'tutor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {post.user?.role || 'Student'}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">• {new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <span className="inline-block bg-blue-50 text-[#5b7cfa] px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide mb-4">
                        {post.subjectTag || 'General'}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4 leading-tight">{post.title}</h1>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{post.description}</p>
                </div>

                {post.media && post.media.length > 0 && (
                    <div className="relative bg-gray-50 border-y border-gray-100 p-4 sm:p-8 flex justify-center items-center min-h-[300px]">
                        
                        {isPdf(post.media[currentMediaIndex]) ? (
                            <div className="text-center w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                                <span className="text-6xl mb-4 block">📄</span>
                                <h4 className="font-bold text-gray-700 mb-4">PDF Document Attached</h4>
                                <a href={post.media[currentMediaIndex]} target="_blank" rel="noreferrer" className="inline-block bg-[#5b7cfa] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#4a6be0] transition-colors">
                                    Open PDF in new tab
                                </a>
                            </div>
                        ) : (
                            <img src={post.media[currentMediaIndex]} alt="Post attachment" className="max-h-[500px] w-auto object-contain rounded-xl shadow-sm" />
                        )}

                        {post.media.length > 1 && (
                            <>
                                <button onClick={prevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center font-bold hover:bg-white hover:scale-110 transition-all">←</button>
                                <button onClick={nextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center font-bold hover:bg-white hover:scale-110 transition-all">→</button>
                                
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    {post.media.map((_, idx) => (
                                        <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentMediaIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="p-4 sm:px-8 bg-gray-50 flex items-center gap-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 font-bold">
                        <span className="text-lg">⬆️</span> {post.upvotes?.length || 0}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 font-bold">
                        <span className="text-lg">⬇️</span> {post.downvotes?.length || 0}
                    </div>
                    <div className="flex items-center gap-2 text-[#5b7cfa] font-bold ml-auto">
                        💬 {post.answers?.length || 0} Answers
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">💬</span> Community Answers
                </h3>
                
                {post.answers?.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium">No answers yet. Be the first to help out!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {post.answers.map(answer => (
                            <div key={answer._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {answer.user?.avatar ? (
                                            <img src={answer.user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                {answer.user?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 leading-tight">{answer.user?.name}</p>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase">{answer.user?.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">{new Date(answer.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap pl-11">{answer.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-8">
                <div className="bg-white p-2 pl-6 rounded-full shadow-sm border border-gray-200 flex items-center opacity-70 cursor-not-allowed">
                    <input type="text" placeholder="Add your answer... (Coming in next commit)" disabled className="flex-1 bg-transparent outline-none text-sm font-medium" />
                    <button disabled className="bg-gray-300 text-white px-6 py-2 rounded-full font-bold text-sm">Post</button>
                </div>
            </div>

        </div>
    );
};

export default SinglePost;