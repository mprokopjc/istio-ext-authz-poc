'use strict'

const Fastify = require('fastify')
const { SignJWT } = require('jose')
const { createSigner } = require('fast-jwt')

// --- Configuration ---
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'
// IMPORTANT: Use a strong, randomly generated secret from environment variables in production!
// Generate one using: require('crypto').randomBytes(32).toString('hex')
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-replace-me-in-prod-and-make-me-strong'
const JWT_EXPIRATION = '15m' // Token expiration time

// --- Pre-computation for Optimization ---
// Encode the secret once for 'jose'
let joseSecretKey
try {
  joseSecretKey = new TextEncoder().encode(JWT_SECRET)
  if (joseSecretKey.byteLength < 32 && process.env.NODE_ENV !== 'test') { // HS256 needs >= 256 bits (32 bytes)
        console.warn(`Warning: JWT_SECRET is less than 32 bytes (${joseSecretKey.byteLength}), which is weak for HS256.`)
  }
} catch (err) {
    console.error('Failed to encode JWT_SECRET:', err)
    process.exit(1)
}


// Create the signer once for 'fast-jwt'
let fastJwtSigner
try {
    fastJwtSigner = createSigner({
        key: JWT_SECRET,
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRATION
    })
} catch(err) {
    console.error('Failed to create fast-jwt signer:', err)
    // fast-jwt might throw if key is invalid for algorithm on creation
    process.exit(1);
}


// --- Fastify Setup ---
// Disable logging for maximum performance during benchmarks. Enable if needed for debugging.
const fastify = Fastify({ logger: false })

// --- Route Handlers ---

// Helper to get user ID and handle missing header
function getUserId(request, reply) {
  const userId = request.headers['x-user-id']
  if (!userId) {
    reply.code(400).send({ error: 'Missing x-user-id header' })
    return null // Indicate failure
  }
  return userId
}

// /auth/jose endpoint
fastify.post('/auth/jose', async (request, reply) => {
  const userId = getUserId(request, reply)
  if (!userId) return reply // Error already sent by getUserId

  try {
    const jwt = await new SignJWT({}) // Payload can be minimal as claims are set via methods
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt() // Sets 'iat' claim
      .setExpirationTime(JWT_EXPIRATION) // Sets 'exp' claim
      // .setAudience('optional audience')
      // .setIssuer('optional issuer')
      .sign(joseSecretKey) // Use pre-encoded key

    reply.send({ token: jwt })
  } catch (err) {
    // Log the internal error, but send a generic response
    console.error('Error signing JWT with jose:', err)
    reply.code(500).send({ error: 'Internal server error during token generation' })
  }
})

// /auth/fastjwt endpoint
fastify.post('/auth/fastjwt', (request, reply) => {
    // Note: fast-jwt signer is synchronous by default for HS algorithms
  const userId = getUserId(request, reply)
  if (!userId) return reply // Error already sent by getUserId

  try {
    // fast-jwt automatically adds 'iat'. 'exp' is handled by 'expiresIn' in the signer config.
    const payload = { sub: userId }
    // You can add more claims here if needed:
    // payload.aud = 'optional audience'
    // payload.iss = 'optional issuer'

    const jwt = fastJwtSigner(payload) // Use pre-configured signer

    reply.send({ token: jwt })
  } catch (err) {
    // Log the internal error, but send a generic response
    console.error('Error signing JWT with fast-jwt:', err)
    reply.code(500).send({ error: 'Internal server error during token generation' })
  }
})

// Health check endpoint (optional but good practice)
fastify.get('/health', (request, reply) => {
    reply.send({ status: 'ok' })
})


// --- Start Server ---
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST })
    console.log(`JWT Benchmark API listening on ${HOST}:${PORT}`)
    console.log(`Node.js version: ${process.version}`)
    console.log(`Using JWT Secret: ${JWT_SECRET.substring(0,5)}... (ensure this is strong and from env vars in production!)`)
    console.log(`Using JWT Expiration: ${JWT_EXPIRATION}`)
    console.log('Endpoints:')
    console.log(`  POST http://${HOST}:${PORT}/auth/jose (Requires 'x-user-id' header)`)
    console.log(`  POST http://${HOST}:${PORT}/auth/fastjwt (Requires 'x-user-id' header)`)

  } catch (err) {
    fastify.log.error(err) // Use fastify's logger if enabled, otherwise console.error
    console.error(err)
    process.exit(1)
  }
}

start()