import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'

/**
 * JWT 플러그인
 * @see https://github.com/fastify/fastify-jwt
 */
export default fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  })
})

