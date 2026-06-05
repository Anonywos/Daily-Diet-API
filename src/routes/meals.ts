import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import z from 'zod'
import { knex } from '../database.js'
import formatDBMeal from '../env/helpers/format_db_meal.js'
import getUserIdFromSessionId from '../env/helpers/get_user_id_from_session_id.js'
import checkSessionId from '../middlewares/check_session_id.js'
import type { Meal } from '../types/database.js'

// Routes Schema
const mealSchema = z.object({
	name: z.string(),
	description: z.string().nullable().optional(),
	in_diet: z.boolean(),
	date: z.coerce.date(),
})

export async function mealRoutes(app: FastifyInstance) {
	//POST new Meal
	app.post('/', {
		preHandler: [checkSessionId],
	}, async (request, reply) => {
		//body
		const _body = mealSchema.safeParse(request.body)

		if (_body.success === false){
			return reply.status(400).send({
				error: {
					type: 'Missing or invalid fields!',
					menssage: z.prettifyError(_body.error),
				},
			})
		}

		const body = _body.data

		const sessionId = request.cookies.sessionId

		const user_id = await getUserIdFromSessionId(sessionId, reply)

		const meal_id = crypto.randomUUID()

		const payload = {
			id: meal_id,
			user_id: user_id,
			name: body.name,
			description: body.description,
			in_diet: body.in_diet,
			date: body.date,
		}

		await knex('meals').insert(payload)

		return reply.status(201).send({
			id: meal_id,
		})
	})

	//GET all user's meals
	app.get('/', {
		preHandler: [checkSessionId],
	}, async (request, reply) => {
		const { sessionId } = request.cookies

		const user_id = await getUserIdFromSessionId(sessionId, reply)

		const listMeals = await knex<Meal>('meals')
			.where('user_id', user_id)

		if (!listMeals) {
			return reply.status(404).send()
		}

		const formattedMeals = listMeals.map((meal) => (
			formatDBMeal(meal)
		))

		return {
			meals: formattedMeals,
		}
	})

	//GET a specific meal
	app.get('/:id', {
		preHandler: [checkSessionId],
	}, async (request, reply) => {
		const getSchemaParams = z.object({
			id: z.uuid(),
		})
		const _id = getSchemaParams.safeParse(request.params)

		if (_id.success === false) {
			return reply.status(400).send({
				error: {
					type: 'Missing meal id!',
					menssage: z.prettifyError(_id.error),
				},
			})
		}

		const { id } = _id.data

		const { sessionId } = request.cookies

		const user_id = await getUserIdFromSessionId(sessionId, reply)

		const meal = await knex<Meal>('meals')
			.where({
				id: id,
				user_id: user_id,
			})
			.first()

		if (!meal) {
			return reply.status(404).send()
		}

		return {
			meal: formatDBMeal(meal),
		}
	})

	//PUT a specific meal
	app.put('/:id', {
		preHandler: [checkSessionId],
	}, async (request, reply) => {
		const getSchemaParams = z.object({
			id: z.uuid(),
		})
		const _id = getSchemaParams.safeParse(request.params)

		if (_id.success === false) {
			return reply.status(400).send({
				error: {
					type: 'Missing meal id!',
					menssage: z.prettifyError(_id.error),
				},
			})
		}

		const { id } = _id.data

		//session_id
		const { sessionId } = request.cookies

		const user_id = await getUserIdFromSessionId(sessionId, reply)
		
		//body
		const _body = mealSchema.safeParse(request.body)

		if (_body.success === false){
			return reply.status(400).send({
				error: {
					type: 'Missing or invalid fields!',
					menssage: z.prettifyError(_body.error),
				},
			})
		}

		const body = _body.data

		const updateCheck = await knex('meals')
			.where({
				id: id,
				user_id: user_id,
			})
			.update(body)

		if (updateCheck === 0) {
			return reply.status(404).send()
		}

		return reply.status(204).send()
	})

	//DELETE a specific meal
	app.delete('/:id', {
		preHandler: [checkSessionId],
	}, async (request, reply) => {
		const getSchemaParams = z.object({
			id: z.uuid(),
		})
		const _id = getSchemaParams.safeParse(request.params)

		if (_id.success === false) {
			return reply.status(400).send({
				error: {
					type: 'Missing meal id!',
					menssage: z.prettifyError(_id.error),
				},
			})
		}

		const { id } = _id.data

		//session_id
		const { sessionId } = request.cookies

		const user_id = await getUserIdFromSessionId(sessionId, reply)

		const deleteCheck = await knex('meals')
			.where({
				id: id,
				user_id: user_id,
			})
			.del()

		if (deleteCheck === 0) {
			return reply.status(404).send()
		}

		return reply.status(204).send()
	})

	//GET Summary
	app.get('/summary', {
		preHandler: [checkSessionId],
	}, async (request, reply) => {
		//session_id
		const { sessionId } = request.cookies

		const user_id = await getUserIdFromSessionId(sessionId, reply)

		const mealList = await knex<Meal>('meals')
			.where('user_id', user_id)

		if (!mealList) {
			return reply.status(404).send()
		}

		const listLength = mealList.length

		const inDietLength = mealList.filter((meal) => (
			meal.in_diet === 1
		)).length

		const offDietlength = mealList.filter((meal) => (
			meal.in_diet === 0
		)).length

		let bestDietStreak = 0
		let currentDietStreak = 0

		for (let index = 0; index < mealList.length; index++) {
			if (mealList[index]?.in_diet === 1) {
				currentDietStreak++
			}else {
				if(currentDietStreak > bestDietStreak){
					bestDietStreak = currentDietStreak
				}
				currentDietStreak = 0
			}
		}
		if (currentDietStreak !== 0 && currentDietStreak > bestDietStreak) {
			bestDietStreak = currentDietStreak
		}

		return {
			summary: {
				meals_length: listLength,
				in_diet: inDietLength,
				off_diet: offDietlength,
				bestStreak: bestDietStreak,
			},
		}
	})
}