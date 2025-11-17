import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('POST /auth/login - success', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      id: 'user123',
      password: 'password123'
    }
  })

  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload)
  assert.ok(body.accessToken)
  assert.ok(body.refreshToken)
  assert.equal(typeof body.accessToken, 'string')
  assert.equal(typeof body.refreshToken, 'string')
})

test('POST /auth/login - missing id', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      password: 'password123'
    }
  })

  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.ok(body.error)
})

test('POST /auth/login - missing password', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      id: 'user123'
    }
  })

  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.ok(body.error)
})

test('POST /auth/login - password too short', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      id: 'user123',
      password: '12345'
    }
  })

  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.payload)
  assert.ok(body.error)
})

test('POST /auth/logout', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/auth/logout'
  })

  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload)
  assert.equal(body.message, 'logout endpoint')
})

test('GET /auth/me', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/auth/me'
  })

  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload)
  assert.equal(body.message, 'me endpoint')
})

