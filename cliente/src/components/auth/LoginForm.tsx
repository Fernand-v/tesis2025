'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { apiUrl } from '@/lib/config';

interface ApiLoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    nombre: string;
    apellido: string;
    role: number | null;
  };
}

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Debes completar usuario y contrasena.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(payload.message ?? 'Error al iniciar sesion');
      }

      const data = (await response.json()) as ApiLoginResponse;
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Usuario
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="usuario"
          />
        </label>
      </div>
      <div className="space-y-2">
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Contrasena
          <div className="relative mt-2">
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 pr-10 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="********"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-200"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-2.548-2.549a8.727 8.727 0 0 0 3.017-4.21.75.75 0 0 0 0-.44c-.966-3.255-4.273-6.72-9.999-6.72-1.511 0-2.844.267-4.013.716zm7.196 7.197 3.607 3.607a3 3 0 0 0-3.607-3.607m0 0c-.18.055-.355.127-.522.214l-1.95-1.95a4.5 4.5 0 0 1 2.472-1.108zm-.934 1.875 2.916 2.916a3 3 0 0 1-2.916-2.916m-1.422-1.422-2.41-2.41C3.94 8.51 1.922 10.684 1.05 13.05a.75.75 0 0 0 0 .44c.966 3.255 4.273 6.72 9.999 6.72 1.909 0 3.545-.405 4.928-1.055l-2.17-2.17a4.5 4.5 0 0 1-6.133-6.133" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </label>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button
        className="w-full rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Verificando...' : 'Iniciar sesion'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Aun no tienes cuenta?{' '}
        <Link className="text-slate-100 underline underline-offset-4" href="/register">
          Registrate
        </Link>
      </p>
    </form>
  );
}
