interface LogoProps {
  size?: number
  withText?: boolean
  className?: string
}

export default function Logo({ size = 32, withText = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Rounded background */}
        <rect width="40" height="40" rx="10" fill="#2563eb" />

        {/* House roof (triangle) */}
        <path
          d="M20 8L31 17H9L20 8Z"
          fill="white"
          fillOpacity="0.95"
        />

        {/* House body */}
        <rect x="12" y="17" width="16" height="13" rx="1" fill="white" fillOpacity="0.95" />

        {/* Door */}
        <rect x="17" y="22" width="6" height="8" rx="1" fill="#2563eb" />

        {/* Connection dots — community network */}
        <circle cx="7" cy="32" r="2.5" fill="#93c5fd" />
        <circle cx="33" cy="32" r="2.5" fill="#93c5fd" />
        <line x1="7" y1="32" x2="12" y2="30" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="33" y1="32" x2="28" y2="30" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* Wordmark */}
      {withText && (
        <span className="font-bold text-blue-600 leading-none">
          <span className="text-gray-900">Neighborhood</span>
          <span className="text-blue-600"> Hub</span>
        </span>
      )}
    </span>
  )
}
