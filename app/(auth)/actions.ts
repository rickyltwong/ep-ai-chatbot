'use server';

import { z } from 'zod';

import { getUser, saveUserWithPassword } from '@/lib/db/queries';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@ep.org.hk'), {
    message: "Only emails from ep.org.hk domain are allowed"
  }),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data' | 'invalid_domain';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const emailValue = formData.get('email') as string;
    
    // Pre-check domain before validation
    if (!emailValue.endsWith('@ep.org.hk')) {
      return { status: 'invalid_domain' };
    }
    
    const validatedData = authFormSchema.parse({
      email: emailValue,
      password: formData.get('password'),
    });

    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result?.error) {
      console.error("Login failed:", result.error);
      return { status: 'failed' };
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data'
    | 'invalid_domain';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const emailValue = formData.get('email') as string;
    
    // Pre-check domain before validation
    if (!emailValue.endsWith('@ep.org.hk')) {
      return { status: 'invalid_domain' };
    }
    
    const validatedData = authFormSchema.parse({
      email: emailValue,
      password: formData.get('password'),
    });

    // Check if user already exists
    const users = await getUser(validatedData.email);
    if (users.length > 0) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    
    // Generate a UUID for the user
    const userId = crypto.randomUUID();
    
    // Use saveUserWithPassword to ensure both tables are updated
    await saveUserWithPassword({
      id: userId,
      email: validatedData.email,
      password: validatedData.password,
      // Optionally, extract name from email
      name: validatedData.email.split('@')[0],
    });
    
    // Try to sign in with the new credentials
    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result?.error) {
      console.error("Login after registration failed:", result.error);
      return { status: 'success' }; // Still return success for registration
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

// Google Sign-in handler
export async function signInWithGoogle() {
  try {
    // Set callbackUrl without any query parameters
    await signIn("google", { 
      callbackUrl: "/",
      redirect: true
    });
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    throw error; // Re-throw to allow handling in the UI
  }
}
