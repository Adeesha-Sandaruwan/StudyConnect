/**
 * RequestPageShell
 * Shared layout for student request pages with consistent hero/header styling.
 */

const RequestPageShell = ({
    badge,
    title,
    highlight,
    description,
    maxWidth = 'max-w-7xl',
    headerActions = null,
    children
}) => {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(99,102,241,0.1),transparent)]" />

            <div className={`relative ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12`}>
                <header className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        {badge && (
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
                                {badge}
                            </p>
                        )}
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            {title}{' '}
                            {highlight && (
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                                    {highlight}
                                </span>
                            )}
                        </h1>
                        {description && (
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {headerActions && (
                        <div className="self-start lg:self-auto">
                            {headerActions}
                        </div>
                    )}
                </header>

                {children}
            </div>
        </div>
    );
};

export default RequestPageShell;
