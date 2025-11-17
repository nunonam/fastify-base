import fp from 'fastify-plugin'
import sql from 'mssql'
import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    mssql: {
      pool: sql.ConnectionPool | null
      query: <T = any>(query: string, params?: Record<string, any>) => Promise<sql.IResult<T>>
      request: () => sql.Request
    }
  }
}

export interface MSSQLPluginOptions {
  server?: string
  database?: string
  user?: string
  password?: string
  port?: number
  options?: {
    encrypt?: boolean
    trustServerCertificate?: boolean
    enableArithAbort?: boolean
    connectTimeout?: number
    requestTimeout?: number
  }
}

/**
 * MSSQL 데이터베이스 연결 플러그인
 * 
 * 환경 변수 또는 옵션을 통해 연결 정보를 설정할 수 있습니다.
 * 환경 변수 우선순위: DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD, DB_PORT
 * 
 * @see https://github.com/tediousjs/node-mssql
 */
export default fp<MSSQLPluginOptions>(async (fastify: FastifyInstance, opts) => {
  // 환경 변수에서 연결 정보 가져오기
  const config: sql.config = {
    server: opts.server || process.env.DB_SERVER || 'localhost',
    database: opts.database || process.env.DB_DATABASE || '',
    user: opts.user || process.env.DB_USER || '',
    password: opts.password || process.env.DB_PASSWORD || '',
    port: opts.port || parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: opts.options?.encrypt ?? (process.env.DB_ENCRYPT === 'true'),
      trustServerCertificate: opts.options?.trustServerCertificate ?? (process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'),
      enableArithAbort: opts.options?.enableArithAbort ?? true,
      connectTimeout: opts.options?.connectTimeout ?? parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
      requestTimeout: opts.options?.requestTimeout ?? parseInt(process.env.DB_REQUEST_TIMEOUT || '30000', 10),
    },
  }

  // 필수 연결 정보 검증 - 연결 정보가 없으면 연결을 시도하지 않음
  const hasRequiredConfig = config.database && config.user && config.password
  let pool: sql.ConnectionPool | null = null

  if (hasRequiredConfig) {
    // Connection Pool 생성
    pool = new sql.ConnectionPool(config)

    // 연결 시도
    try {
      await pool.connect()
      fastify.log.info({
        server: config.server,
        database: config.database,
        port: config.port,
      }, 'MSSQL database connected successfully')
    } catch (error) {
      fastify.log.warn(error, 'Failed to connect to MSSQL database. MSSQL plugin will not be available.')
      // 연결 실패 시 pool을 null로 설정
      pool = null
    }
  } else {
    fastify.log.warn(
      'MSSQL connection information is not provided. ' +
      'Set DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD environment variables to enable database connection.'
    )
  }

  // Fastify 인스턴스에 MSSQL 기능 추가 (연결 정보가 없어도 항상 정의)
  fastify.decorate('mssql', {
    pool,
    /**
     * 쿼리 실행 헬퍼 함수
     * @param query SQL 쿼리 문자열
     * @param params 파라미터 객체 (선택사항)
     * @returns 쿼리 결과
     */
    async query<T = any>(query: string, params?: Record<string, any>): Promise<sql.IResult<T>> {
      if (!pool) {
        throw new Error('MSSQL database connection is not available. Please configure database connection settings.')
      }
      
      const request = pool.request()
      
      // 파라미터가 있으면 추가
      if (params) {
        Object.keys(params).forEach(key => {
          request.input(key, params[key])
        })
      }
      
      return await request.query<T>(query)
    },
    /**
     * Request 객체 생성 (더 세밀한 제어가 필요한 경우)
     * @returns SQL Request 객체
     */
    request(): sql.Request {
      if (!pool) {
        throw new Error('MSSQL database connection is not available. Please configure database connection settings.')
      }
      return pool.request()
    },
  })

  // Fastify 종료 시 연결 풀 닫기
  fastify.addHook('onClose', async () => {
    if (pool) {
      try {
        await pool.close()
        fastify.log.info('MSSQL connection pool closed')
      } catch (error) {
        fastify.log.error(error, 'Error closing MSSQL connection pool')
      }
    }
  })
})

