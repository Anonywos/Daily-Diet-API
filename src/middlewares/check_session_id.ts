import type { FastifyReply, FastifyRequest } from 'fastify'


export default async function checkSessionId(request: FastifyRequest, reply: FastifyReply) {
	const session_id = request.cookies.sessionId
	
	if (!session_id){
		reply.status(401).send({
			error: 'Unauthotized',
		})

		return
	}
}