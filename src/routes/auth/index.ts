import { FastifyPluginAsync } from 'fastify'

interface LoginBody {
  id: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

interface ErrorResponse {
  error: string
}

// Login Request Body Schema
const loginBodySchema = {
  type: 'object',
  required: ['id', 'password'],
  properties: {
    id: {
      type: 'string',
      description: 'User ID'
    },
    password: {
      type: 'string',
      description: 'Password',
      minLength: 6
    }
  }
} as const

// Login Response Schema
const loginResponseSchema = {
  200: {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        description: 'Access Token'
      },
      refreshToken: {
        type: 'string',
        description: 'Refresh Token'
      }
    }
  }
} as const

// Login Endpoint Schema
const loginSchema = {
  tags: ['auth'],
  summary: 'Login',
  description: 'User Login',
  body: loginBodySchema,
  response: loginResponseSchema
} as const

const auth: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post<{ Body: LoginBody; Reply: LoginResponse | ErrorResponse }>(
    '/login',
    { schema: loginSchema },
    async function (request, reply) {
      const { id } = request.body

      // TODO: DB에서 사용자 조회 및 비밀번호 검증
      // const user = await db.findUserById(id)
      // if (!user || !await bcrypt.compare(password, user.password)) {
      //   return reply.code(401).send({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' })
      // }

      // DB 조회는 했다 치고, 사용자 정보를 가정
      const user = { id, name: 'Test User' }

      // JWT 토큰 생성
      const accessToken = fastify.jwt.sign(
        { id: user.id, name: user.name },
        { expiresIn: '15m' }
      )

      const refreshToken = fastify.jwt.sign(
        { id: user.id, type: 'refresh' },
        { expiresIn: '7d' }
      )

      return {
        accessToken,
        refreshToken
      }
    }
  )

  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Logout',
      description: 'User Logout',
    }
  }, async function (request, reply) {
    // TODO: 로그아웃 로직 구현
    return { message: 'logout endpoint' }
  })

  fastify.get<{ Reply: { id: string; name: string } }>('/me', {
    schema: {
      tags: ['auth'],
      summary: 'Me',
      description: 'Get Current User Information',
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    preHandler: [fastify.authenticate]
  }, async function (request, reply) {
    // HttpError를 throw하려면 fastify.httpErrors를 사용합니다
    // throw new Error('test error'); // ❌ 이렇게 하면 안됩니다
    // throw fastify.httpErrors.internalServerError('test error'); // ✅ 이렇게 사용
    
    // 인증된 사용자 정보 반환
    const user = request.user as { id: string; name?: string } | undefined
    return {
      id: user?.id || 'unknown',
      name: user?.name || 'Unknown User'
    }
  })
}

export default auth

