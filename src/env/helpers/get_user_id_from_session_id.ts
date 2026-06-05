import type { FastifyReply } from 'fastify'
import { knex } from '../../database.js'
import type { Meal } from '../../types/database.js'


export default async function getUserIdFromSessionId(
	sessionId: string | null | undefined, 
	reply: FastifyReply,
): Promise<string> {
	if (!sessionId) {
		throw new Error('Session Id is missing!')
	}
	const user = await knex<Meal>('users')
		.where('session_id', sessionId)
		.first()

	if (!user) {
		return reply.status(401).send({
			error: 'Unauthorized',
		})
	}

	return user.id
}