export function Mark({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="39" fill="#08343c" />
      <circle cx="40" cy="40" r="34.5" fill="none" stroke="#f2c14e" strokeWidth="1.5" />
      <circle className="sun" cx="34" cy="30" r="11" fill="#f0a03a" />
      <circle cx="31" cy="27" r="3.2" fill="#fff6d8" opacity="0.9" />
      <path
        d="M58 58c-1-12-2-22-1-30"
        fill="none"
        stroke="#7a5233"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M57 30c-10-8-18-6-22-12"
        fill="none"
        stroke="#2f8a52"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M57 30c10-8 16-4 18-12"
        fill="none"
        stroke="#247246"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M57 31c9 1 14 7 12 13"
        fill="none"
        stroke="#3c9a60"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        className="tide"
        d="M8 50c7-6 13-6 20 0s13 6 20 0 13-6 20 0"
        fill="none"
        stroke="#9aebf0"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        className="tide tide-slow"
        d="M8 60c7-5 13-5 20 0s13 5 20 0 13-5 20 0"
        fill="none"
        stroke="#1a8f9c"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TideLine() {
  return (
    <svg viewBox="0 0 220 36" className="mt-3 h-8 w-52" aria-hidden="true">
      <path
        className="tide"
        d="M4 14c16-10 28-10 44 0s28 10 44 0 28-10 44 0 28 10 44 0 20-8 36 0"
        fill="none"
        stroke="#0e7480"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className="tide tide-slow"
        d="M4 26c16-8 28-8 44 0s28 8 44 0 28-8 44 0 28 8 44 0 20-6 36 0"
        fill="none"
        stroke="#e8942a"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
