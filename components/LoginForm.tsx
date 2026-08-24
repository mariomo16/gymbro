"use client";

import { useActionState, useState } from "react";
import {
  type AuthState,
  loginAction,
  registerAction,
} from "@/lib/actions/auth";

const initial: AuthState = {};

export default function LoginForm() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [loginState, doLogin, loginPending] = useActionState(
    loginAction,
    initial,
  );
  const [registerState, doRegister, registerPending] = useActionState(
    registerAction,
    initial,
  );

  const state = tab === "login" ? loginState : registerState;
  const pending = tab === "login" ? loginPending : registerPending;

  return (
    <div className="w-full">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-card p-1">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-11 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? "bg-raised text-ink shadow-sm" : "text-mute"
            }`}
          >
            {t === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form
        key={tab}
        action={tab === "login" ? doLogin : doRegister}
        className="flex flex-col gap-3"
      >
        {tab === "register" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-mute">
              Nombre real
            </span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={60}
              placeholder="Tu nombre"
              className="input"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-mute">
            Usuario
          </span>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoComplete="username"
            placeholder="tu_usuario"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-mute">
            Contraseña
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className="input"
          />
        </label>

        {state.error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary mt-2 h-13 w-full"
        >
          {pending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
          ) : tab === "login" ? (
            "Entrar"
          ) : (
            "Empezar"
          )}
        </button>
      </form>
    </div>
  );
}
