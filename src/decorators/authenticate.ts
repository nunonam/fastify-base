import fp from 'fastify-plugin'
import { FastifyRequest, FastifyReply } from 'fastify'
import { HttpError } from '@fastify/sensible'

/**
 * 인증 데코레이터
 * Bearer 토큰을 검증하여 인증된 사용자만 API에 접근할 수 있도록 합니다.
 */
export default fp(async (fastify) => {
  // 인증 미들웨어 데코레이터
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = request.headers.authorization

      if (!authHeader) {
        throw fastify.httpErrors.unauthorized('인증 토큰이 필요합니다.')
      }

      // Bearer 토큰 형식 확인
      if (!authHeader.startsWith('Bearer ')) {
        throw fastify.httpErrors.unauthorized('Bearer 토큰 형식이 올바르지 않습니다.')
      }

      // Bearer 접두사 제거
      const token = authHeader.substring(7)

      // JWT 토큰 검증
      const decoded = fastify.jwt.verify<{ id: string; name?: string }>(token)

      // request에 사용자 정보 저장
      request.user = decoded
    } catch (error) {
      // JWT 검증 실패 또는 기타 에러
      if (error instanceof HttpError) {
        throw error
      }
      throw fastify.httpErrors.unauthorized('유효하지 않은 토큰입니다.')
    }
  })
})

// TypeScript 타입 선언
declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}

