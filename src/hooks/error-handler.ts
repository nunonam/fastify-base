import fp from 'fastify-plugin'
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { HttpError } from '@fastify/sensible'

/**
 * Slack webhook으로 에러 메시지 전송
 */
async function sendSlackNotification(
  webhookUrl: string,
  error: FastifyError,
  request: FastifyRequest
): Promise<void> {
  try {
    const errorDetails = {
      text: '🚨 *API Error*',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 API Error'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Status Code:*\n${error.statusCode || 500}`
            },
            {
              type: 'mrkdwn',
              text: `*Error Name:*\n${error.name || 'Error'}`
            },
            {
              type: 'mrkdwn',
              text: `*Method:*\n${request.method}`
            },
            {
              type: 'mrkdwn',
              text: `*URL:*\n${request.url}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error Message:*\n\`\`\`${error.message || 'Unknown error'}\`\`\``
          }
        }
      ]
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorDetails)
    })
  } catch (slackError) {
    // Slack 전송 실패는 조용히 무시 (무한 루프 방지)
    console.error('Failed to send Slack notification:', slackError)
  }
}

/**
 * 전역 에러 핸들러 훅
 * 모든 에러를 캐치하여 로깅하고 적절한 HTTP 응답을 반환합니다.
 * 500 이상의 에러는 Slack webhook으로 알림을 전송합니다.
 */
export default fp(async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // 에러 로깅 (error 레벨로 로깅)
    const statusCode = error.statusCode || 500
    fastify.log.error({
      err: error,
      url: request.url,
      method: request.method,
      statusCode
    }, error.message || 'Internal Server Error')

    // 500 이상의 에러인 경우 Slack 알림 전송 (비동기, 응답 전송을 막지 않음)
    if (statusCode >= 500) {
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
      if (slackWebhookUrl) {
        // 비동기로 처리하여 응답 전송을 지연시키지 않음
        void sendSlackNotification(slackWebhookUrl, error, request)
      }
    }

    // 이미 응답이 전송된 경우 처리하지 않음
    if (reply.sent) {
      return
    }

    // HttpError 인스턴스인 경우 (fastify.httpErrors로 생성된 에러)
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name || 'Error',
        message: error.message
      })
    }

    // statusCode가 있는 경우 (다른 방식으로 생성된 에러)
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name || 'Error',
        message: error.message
      })
    }

    // 알 수 없는 에러는 httpErrors를 사용하여 일관된 형식으로 변환
    const internalError = fastify.httpErrors.internalServerError(
      error.message || 'An internal server error occurred'
    )
    reply.code(internalError.statusCode).send({
      statusCode: internalError.statusCode,
      error: internalError.name,
      message: internalError.message
    })
  })
})

