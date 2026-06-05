import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import z from 'zod'
import { knex } from '../database.js'


export async function userRoutes(app: FastifyInstance) {
	// Create a user
	app.post('', async (request, reply) => {
		const userSchema = z.object({
			name: z.string(),
			email: z.string(),
			password: z.string(),
		})

		const body = userSchema.parse(request.body)

		// session_id
		let session_id = request.cookies.sessionId

		if (!session_id){
			session_id = crypto.randomUUID()

			reply.cookie('sessionId', session_id, {
				path: '/',
				maxAge: 60*60*24*7,// 7 days
			})
		}

		await knex('users').insert({
			id: crypto.randomUUID(),
			session_id: session_id,
			name: body.name,
			email: body.email,
			password: body.password,
		})

		return reply.status(201).send()
	})
}