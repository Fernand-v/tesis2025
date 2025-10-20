import AuthCard from '@/components/auth/AuthCard';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crea tu usuario"
      subtitle="Completa los datos basicos y genera un acceso con validez de cuatro horas."
    >
      <RegisterForm />
    </AuthCard>
  );
}
