export function AIMatchingIcon({
  className = "w-12 h-12",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        fill="url(#gradient1)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="gradient1" x1="2" y1="7" x2="22" y2="7">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ResumeIcon({
  className = "w-12 h-12",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="2"
        width="16"
        height="20"
        rx="2"
        fill="url(#gradient2)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="7"
        y1="7"
        x2="17"
        y2="7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="11"
        x2="14"
        y2="11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="15"
        x2="17"
        y2="15"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="18"
        x2="13"
        y2="18"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="gradient2" x1="4" y1="2" x2="20" y2="22">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function RocketIcon({
  className = "w-12 h-12",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 16.5C4.5 16.5 5.5 14.5 8 14.5C10.5 14.5 11 16.5 13.5 16.5C16 16.5 17 14.5 17 14.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 3L12 7M12 3C8 3 6 8 6 12L12 18L18 12C18 8 16 3 12 3Z"
        fill="url(#gradient3)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2" fill="white" />
      <defs>
        <linearGradient id="gradient3" x1="6" y1="3" x2="18" y2="18">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CheckCircleIcon({
  className = "w-5 h-5",
}: {
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      />
    </svg>
  );
}

export function SparklesIcon({
  className = "w-5 h-5",
}: {
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
    </svg>
  );
}
