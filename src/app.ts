import * as path from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type AppOptions = {
  // Place your custom options for app below here.
  logger?: FastifyServerOptions['logger']
} & Partial<AutoloadPluginOptions>

// 환경별 logger 설정
const environment = process.env.NODE_ENV || 'development'

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'host,remoteAddress,remotePort',
      },
    },
  },
  production: true,
  test: false,
}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
  logger: envToLogger[environment as keyof typeof envToLogger] ?? true
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!

  // Do not touch the following lines

  // 1. 외부 플러그인 로드 (jwt, sensible, swagger 등)
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true
  })

  // 2. 데코레이터 로드 (fastify.decorate로 추가하는 기능들)
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'decorators'),
    options: opts,
    forceESM: true
  })

  // 3. 훅 로드 (error handler 등)
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'hooks'),
    options: opts,
    forceESM: true
  })

  // 4. 라우트 로드
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true
  })
}

export default app
export { app, options }
