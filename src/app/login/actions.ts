"use server";

/**
 * Server Action del login. Al ser una acción de servidor, la contraseña
 * viaja en el POST y se procesa en el servidor: nunca queda expuesta en
 * el bundle de JavaScript del navegador.
 */
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      // Mensaje genérico a propósito: no revelamos si falló el email
      // o la contraseña (evita que alguien descubra qué emails existen).
      return { error: "Email o contraseña incorrectos." };
    }
    // signIn lanza un redirect interno de Next: hay que dejarlo pasar.
    throw error;
  }
}
