import { AuthShell } from "@/components/app/auth/auth-shell";
import { LoginForm } from "@/components/app/auth/login-form";

export default function LoginPage() {
    return (
        <AuthShell>
            <LoginForm />
        </AuthShell>
    );
}