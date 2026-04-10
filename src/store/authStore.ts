import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

// Spanish translations for common Supabase auth errors
const errorTranslations: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Debes confirmar tu email. Revisa tu correo (incluyendo spam)',
  'User already registered': 'Este email ya está registrado. Intenta iniciar sesión',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'Formato de email inválido',
  'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos',
  'For security purposes, you can only request this after': 'Por seguridad, espera unos segundos antes de reintentar',
  'Signup requires a valid password': 'La contraseña es requerida',
  'JSON object requested, multiple (or no) rows returned': 'Error de perfil. Contacta soporte',
};

function translateError(message: string): string {
  // Check exact matches first
  if (errorTranslations[message]) return errorTranslations[message];
  // Check partial matches
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (message.includes(key)) return value;
  }
  return message;
}

interface AuthStoreState {
  user: User | null;
  session: string | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, countryCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.session) {
        set({ session: data.session.access_token });

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        set({
          user: profile as User,
          isLoading: false,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      set({
        error: translateError(message),
        isLoading: false,
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string, fullName: string, countryCode: string) => {
    set({ isLoading: true, error: null });
    try {
      // Pass full_name in metadata so the trigger can use it
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            country_code: countryCode,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // The trigger 'on_auth_user_created' auto-creates the profile.
        // We DON'T insert a profile manually to avoid duplicate key errors.

        // If email confirmation is disabled, we'll have a session immediately
        if (data.session) {
          // Update the profile with extra fields the trigger didn't set
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              country_code: countryCode,
            })
            .eq('id', data.user.id);

          if (updateError) {
            console.warn('Profile update warning:', updateError.message);
          }

          // Fetch the complete profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          set({
            user: profile ? (profile as User) : null,
            session: data.session.access_token,
            isLoading: false,
          });
        } else {
          // Email confirmation is enabled — user needs to confirm email
          // This is NOT an error, it's expected behavior
          set({ isLoading: false });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al registrarse';
      set({
        error: translateError(message),
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'karuweed://reset-password',
        }
      );

      if (error) throw error;
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al enviar email de recuperación';
      set({
        error: translateError(message),
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        session: null,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cerrar sesión';
      set({
        error: translateError(message),
        isLoading: false,
      });
      throw error;
    }
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        set({
          user: null,
          session: null,
          isLoading: false,
        });
        return;
      }

      set({ session: sessionData.session.access_token });

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      if (error) throw error;

      set({
        user: profile as User,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        session: null,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
