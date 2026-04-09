import { Link } from 'react-router-dom';

/**
 * RequestViewTabs
 * Reusable segmented tabs for switching between request views.
 */
const RequestViewTabs = ({ items }) => {
    return (
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/85 p-1 shadow-sm backdrop-blur-sm">
            {items.map((item) => {
                const baseClass = `px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    item.active
                        ? 'bg-[#5b7cfa] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`;

                if (item.to) {
                    return (
                        <Link key={item.label} to={item.to} className={baseClass}>
                            {item.label}
                        </Link>
                    );
                }

                return (
                    <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className={baseClass}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
};

export default RequestViewTabs;
