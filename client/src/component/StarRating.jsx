const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const StarIcon = ({ className }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.053 3.24a1 1 0 00.95.69h3.405c.97 0 1.372 1.24.588 1.81l-2.755 2.002a1 1 0 00-.364 1.118l1.053 3.24c.3.922-.755 1.688-1.539 1.118l-2.755-2.001a1 1 0 00-1.176 0l-2.755 2.001c-.784.57-1.838-.196-1.539-1.118l1.053-3.24a1 1 0 00-.364-1.118L2.1 8.667c-.784-.57-.381-1.81.588-1.81h3.405a1 1 0 00.95-.69l1.053-3.24z" />
  </svg>
);

const STAR_SIZE = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

const StarRating = ({ value = 0, count = 0, className = '', showMeta = true, size = 'sm' }) => {
  const safeValue = clamp(Number(value) || 0, 0, 5);
  const stars = Array.from({ length: 5 }, (_, index) => clamp((safeValue - index) * 100, 0, 100));
  const starSize = STAR_SIZE[size] || STAR_SIZE.sm;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" aria-label={`Rated ${safeValue.toFixed(1)} out of 5`}>
        {stars.map((fillPercent, index) => (
          <span key={index} className={`relative inline-flex ${starSize}`}>
            <StarIcon className={`${starSize} text-[#d4dfd8]`} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <StarIcon className={`${starSize} text-[#f4b740]`} />
            </span>
          </span>
        ))}
      </div>
      {showMeta && (
        <span className="text-[11px] font-semibold text-[#4f6d5c]">
          {safeValue.toFixed(1)} ({Number(count) || 0})
        </span>
      )}
    </div>
  );
};

export default StarRating;
