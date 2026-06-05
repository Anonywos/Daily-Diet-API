import cookies from '@fastify/cookie'
import fastify from 'fastify'
import { mealRoutes } from './routes/meals'
import { userRoutes } from './routes/users'

export const app = fastify()

app.register(cookies)

app.register(userRoutes, {
	prefix: 'users',
})

app.register(mealRoutes, {
	prefix: 'meals',
})