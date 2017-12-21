'use strict'

const http = require('http')
const test = require('tap').test
const fastify = require('../')

test('handlers receive correct `this` context', (t) => {
  t.plan(4)

  // simulate plugin that uses fastify-plugin
  const plugin = function (instance, opts, next) {
    instance.decorate('foo', 'foo')
    next()
  }
  plugin[Symbol.for('skip-override')] = true

  const instance = fastify()
  instance.register(plugin, (err) => {
    if (err) t.threw(err)
  })

  instance.get('/', function (req, reply) {
    t.ok(this.foo)
    t.is(this.foo, 'foo')
    reply.send()
  })

  instance.listen(0, (err) => {
    instance.server.unref()
    if (err) t.threw(err)
    t.ok(instance.foo)
    t.is(instance.foo, 'foo')

    const address = `http://127.0.0.1:${instance.server.address().port}/`
    http.get(address, () => {}).on('error', t.threw)
  })
})

test('handlers have access to the internal context', (t) => {
  t.plan(5)

  const instance = fastify()
  instance.get('/', {config: {foo: 'bar'}}, function (req, reply) {
    t.ok(reply.context)
    t.ok(reply.context.config)
    t.type(reply.context.config, Object)
    t.ok(reply.context.config.foo)
    t.is(reply.context.config.foo, 'bar')
    reply.send()
  })

  instance.listen(0, (err) => {
    instance.server.unref()
    if (err) t.threw(err)
    const address = `http://127.0.0.1:${instance.server.address().port}/`
    http.get(address, () => {}).on('error', t.threw)
  })
})
