'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { apiUrl } from '@/lib/config';

interface ApiRegisterResponse {
  user: {
    id: number;
    username: string;
    nombre: string;
    apellido: string;
    rol: number | null;
    estado: number;
  };
  message?: string;
}

type RegisterFormState = {
  username: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  celular: string;
  direccion: string;
};

const INITIAL_FORM: RegisterFormState = {
  username: '',
  password: '',
  confirmPassword: '',
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  celular: '',
  direccion: '',
};

export default function RegisterForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<RegisterFormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (formState.password !== formState.confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    if (!formState.username || !formState.password || !formState.nombre || !formState.apellido) {
      setError('Completa usuario, contrasena, nombre y apellido.');
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = {
        username: formState.username,
        password: formState.password,
        nombre: formState.nombre,
        apellido: formState.apellido,
      };

      if (formState.correo) payload.correo = formState.correo;
      if (formState.telefono) payload.telefono = formState.telefono;
      if (formState.celular) payload.celular = formState.celular;
      if (formState.direccion) payload.direccion = formState.direccion;

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(result.message ?? 'No se pudo registrar el usuario');
      }

      const data = (await response.json()) as ApiRegisterResponse;
      setSuccess(data.message ?? 'Registro enviado. Espera la habilitacion de un administrador.');
      setFormState(INITIAL_FORM);

      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }

      redirectTimeout.current = setTimeout(() => {
        router.replace('/login');
      }, 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    () => () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    },
    [],
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Usuario *
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            name="username"
            value={formState.username}
            onChange={handleChange}
            autoComplete="username"
            placeholder="usuario"
          />
        </label>
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Correo
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            name="correo"
            type="email"
            value={formState.correo}
            onChange={handleChange}
            autoComplete="email"
            placeholder="correo@dominio.com"
          />
        </label>
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Nombre *
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            name="nombre"
            value={formState.nombre}
            onChange={handleChange}
            placeholder="Nombre"
          />
        </label>
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Apellido *
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            name="apellido"
            value={formState.apellido}
            onChange={handleChange}
            placeholder="Apellido"
          />
        </label>
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Telefono
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            name="telefono"
            value={formState.telefono}
            onChange={handleChange}
            placeholder="(0991) 123 456"
          />
        </label>
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Celular
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            name="celular"
            value={formState.celular}
            onChange={handleChange}
            placeholder="+595 991 000 000"
          />
        </label>
        <label className="flex flex-col text-left text-sm font-medium text-slate-300 sm:col-span-2">
          Direccion
          <input
            className="mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
            name="direccion"
            value={formState.direccion}
            onChange={handleChange}
            placeholder="Calle 123"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Contrasena *
          <div className="relative mt-2">
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 pr-10 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formState.password}
              onChange={handleChange}
              autoComplete="new-password"
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
        <label className="flex flex-col text-left text-sm font-medium text-slate-300">
          Confirmar contrasena *
          <div className="relative mt-2">
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 pr-10 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formState.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="********"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-200"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            >
              {showConfirmPassword ? (
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
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      <button
        className="w-full rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Crear cuenta'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Ya tienes cuenta?{' '}
        <Link className="text-slate-100 underline underline-offset-4" href="/login">
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
