const Loader = ({ fullScreen = true, text = "Loading..." }) => {
    const content = (
        <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative flex justify-center items-center w-20 h-20">
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#5b7cfa] border-r-[#5b7cfa] animate-[spin_2s_linear_infinite] shadow-[0_0_15px_rgba(91,124,250,0.5)]"></div>
                <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-[#4a6be0] border-l-[#4a6be0] animate-[spin_1.5s_linear_infinite_reverse] opacity-80"></div>
                <div className="absolute inset-6 bg-gradient-to-tr from-[#5b7cfa] to-[#8a9dfa] rounded-full animate-pulse shadow-[0_0_20px_rgba(91,124,250,0.6)]"></div>
            </div>
            
            {text && (
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[#5b7cfa] font-extrabold tracking-[0.2em] uppercase text-sm animate-pulse drop-shadow-sm">
                        {text}
                    </span>
                    <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#5b7cfa] rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-[#5b7cfa] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-[#5b7cfa] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                </div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-md transition-all duration-500">
                {content}
            </div>
        );
    }

    return <div className="flex justify-center items-center w-full p-8">{content}</div>;
};

export default Loader;