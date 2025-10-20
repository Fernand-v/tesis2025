import AuthCard from '@/components/auth/AuthCard';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthCard title="Bienvenido de nuevo" subtitle="Ingresa tus datos para acceder al panel.">
      <LoginForm />
    </AuthCard>
  );
}
