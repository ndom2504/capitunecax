import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      return new Response(
        JSON.stringify({ message: 'Tous les champs obligatoires doivent être remplis.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: In production, this would:
    // 1. Hash the password
    // 2. Store user in database (Cloudflare D1 or KV)
    // 3. Send verification email
    // 4. Create session
    
    // For now, simulate successful signup
    console.log('New user signup:', {
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      country: data.country,
      phone: data.phone
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Compte créé avec succès!' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ message: 'Une erreur est survenue lors de la création du compte.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
