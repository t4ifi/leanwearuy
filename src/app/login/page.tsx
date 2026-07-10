"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0a0912] px-5">
      <div className="w-full max-w-sm rounded-2xl border border-[#221d36] bg-[#110f1d] p-8">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-[#f3f1fa]">
          Lean
          <span className="bg-gradient-to-r from-[#ff6fd1] via-[#b06bff] to-[#8b5cf6] bg-clip-text text-transparent">
            Wear
          </span>
        </h1>
        <p className="mt-2 text-center text-sm text-[#a39ec0]">
          Panel privado. Iniciá sesión para continuar.
        </p>

        <form action={formAction} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-[#a39ec0]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-[#2c2647] bg-[#1b1730] px-3.5 py-3 text-[#f3f1fa] outline-none transition focus:border-[#8b5cf6]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-[#a39ec0]">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#2c2647] bg-[#1b1730] px-3.5 py-3 text-[#f3f1fa] outline-none transition focus:border-[#8b5cf6]"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-[#ff8a8a]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
