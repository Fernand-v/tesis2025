import type { ReactNode } from 'react';
import { empresaNombre } from '@/lib/config';
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row md:gap-16">
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-balance text-4xl font-bold sm:text-5xl">
            {empresaNombre}
          </h1>
          <p className="mt-4 text-pretty text-slate-300 sm:text-lg">
            Ingresa con tus credenciales corporativas para continuar. Las cuentas nuevas quedan
            pendientes de habilitacion por un administrador.
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}
