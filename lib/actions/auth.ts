"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { get, run } from "@/lib/db";

export type AuthState = { error?: string };

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password)
    return { error: "Completa usuario y contraseña." };

  const user = get<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE username = ?",
    username,
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await setSessionCookie(createSession(user.id));
  redirect("/");
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (username.length < 3 || !/^[a-z0-9._-]+$/.test(username)) {
    return {
      error: "Usuario inválido (mín. 3 caracteres: letras, números, . _ -).",
    };
  }
  if (name.length > 60) return { error: "El nombre es demasiado largo." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };

  const exists = get<{ id: number }>(
    "SELECT id FROM users WHERE username = ?",
    username,
  );
  if (exists) return { error: "Ese usuario ya existe." };

  const r = run(
    "INSERT INTO users (username, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
    username,
    name || null,
    hashPassword(password),
    Date.now(),
  );
  await setSessionCookie(createSession(r.lastInsertRowid));
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
