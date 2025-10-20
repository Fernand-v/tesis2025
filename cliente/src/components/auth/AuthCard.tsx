'use client';

import type { PropsWithChildren } from 'react';

interface AuthCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/70 backdrop-blur">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
