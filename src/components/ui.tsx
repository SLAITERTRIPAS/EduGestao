import React from 'react';

export function Button({ className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }) {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

export function Input({ className = '', label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-bold text-slate-700">{label}</label>}
      <input
        className={`block w-full rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm border focus:border-blue-500 focus:ring-blue-500 outline-none ${className}`}
        {...props}
      />
    </div>
  );
}

export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white text-black shadow rounded-lg border border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}
