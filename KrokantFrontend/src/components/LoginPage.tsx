import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-form" onSubmit={submit}>
        <p className="muted small">Веб-сервис мониторинга задач</p>
        <h1>Вход в систему</h1>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="primary" type="submit" disabled={loading}>
          <LogIn size={18} />
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
