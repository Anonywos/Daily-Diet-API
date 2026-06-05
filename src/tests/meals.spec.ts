import { execSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../app.js'

async function createUserAndGetCookie(): Promise<string> {
	const user = await request(app.server)
		.post('/users')
		.send({
			name: 'John Doe',
			email: 'johndoe@testmail.com',
			password: '123456',
		}).expect(201)

	const cookies = user.header['set-cookie']

	if (!cookies) {
		throw new Error('Expected Set-Cookie header to be present')
	}

	return cookies
}

describe('Meals routes', () => {
	beforeAll(async () => {
		app.ready()
	})

	afterAll(async () => {
		app.close()
	})

	beforeEach(async () => {
		execSync('npm run knex migrate:rollback --all')
		execSync('npm run knex migrate:latest')
	})

	//POST -------------------------------------------------
	it('should be able to create a new meal', async () => {
		const cookies = await createUserAndGetCookie()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: new Date(),
			})
			.expect(201)
	})

	it('should not be able to create a new meal without a session id', async () => {
		await request(app.server)
			.post('/meals')
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: new Date(),
			})
			.expect(401)
	})

	it('should not be able to create a new meal without a required field', async () => {
		const cookies = await createUserAndGetCookie()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				description: 'tomo no café da manhã',
				in_diet: true,
				date: new Date(),
			})
			.expect(400)
	})

	it('should be able to create a new meal without a description', async () => {
		const cookies = await createUserAndGetCookie()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				in_diet: true,
				date: new Date(),
			})
			.expect(201)
	})

	//GET -------------------------------------------------
	it('should be able to get users meals list', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date,
			})
			.expect(201)

		const mealList = await request(app.server)
			.get('/meals')
			.set('Cookie', cookies)
			.expect(200)

		expect(mealList.body.meals).toEqual(expect.arrayContaining([
			expect.objectContaining({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date.toISOString(),
			}),
			expect.objectContaining({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date.toISOString(),
			}),
		]))
	})

	it('should not be able to get users meals list without session id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.get('/meals')
			.expect(401)
	})

	//GET by Id -------------------------------------------------
	it('should be able to get user meals by id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		const { id } = mealId.body

		const mealById = await request(app.server)
			.get(`/meals/${id}`)
			.set('Cookie', cookies)
			.expect(200)
		
		expect(mealById.body.meal).toEqual(expect.objectContaining({
			name: 'cuscuz',
			description: 'tomo no café da manhã',
			in_diet: true,
			date: date.toISOString(),
		}))
	})

	it('should not be able to get user meals by id without session id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		const { id } = mealId.body

		await request(app.server)
			.get(`/meals/${id}`)
			.expect(401)
	})

	it('should not be able to get user meals by id without meal id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.get('/meals/id')
			.set('Cookie', cookies)
			.expect(400)
	})

	it('should not be able to get a meal from another user by id', async () => {
		const user1 = await request(app.server)
			.post('/users')
			.send({
				name: 'John Doe',
				email: 'johndoe@testmail.com',
				password: '123456',
			}).expect(201)

		const cookies1 = user1.header['set-cookie']

		if (!cookies1) {
			throw new Error('Expected Set-Cookie header to be present')
		}
		
		const user2 = await request(app.server)
			.post('/users')
			.send({
				name: 'Mary Doe',
				email: 'marydoe@testmail.com',
				password: '123456',
			}).expect(201)

		const cookies2 = user2.header['set-cookie']

		if (!cookies2) {
			throw new Error('Expected Set-Cookie header to be present')
		}

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies1)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		const { id } = mealId.body

		await request(app.server)
			.get(`/meals/${id}`)
			.set('Cookie', cookies2)
			.expect(404)
	})

	//PUT by Id -------------------------------------------------
	it('should be able to update a meal by id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)
			
		const { id } = mealId.body

		await request(app.server)
			.put(`/meals/${id}`)
			.set('Cookie', cookies)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date,
			})
			.expect(204)
		
		const updatedMeal = await request(app.server)
			.get(`/meals/${id}`)
			.set('Cookie', cookies)
			.expect(200)

		expect(updatedMeal.body.meal).toEqual(expect.objectContaining({
			name: 'café',
			description: 'tomo no café da manhã',
			in_diet: false,
			date: date.toISOString(),
		}))
	})

	it('should not be able to update a meal by id without session id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)
			
		const { id } = mealId.body

		await request(app.server)
			.put(`/meals/${id}`)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date,
			})
			.expect(401)
	})

	it('should not be able to update a meal by id without id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.put('/meals/id')
			.set('Cookie', cookies)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date,
			})
			.expect(400)
	})

	it('should not be able to update a meal by id without required fields', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)
			
		const { id } = mealId.body

		await request(app.server)
			.put(`/meals/${id}`)
			.set('Cookie', cookies)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
			})
			.expect(400)
	})

	it('should be able to update a meal by id without description', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)
			
		const { id } = mealId.body

		await request(app.server)
			.put(`/meals/${id}`)
			.set('Cookie', cookies)
			.send({
				name: 'café',
				in_diet: false,
				date: date,
			})
			.expect(204)
		
		const updatedMeal = await request(app.server)
			.get(`/meals/${id}`)
			.set('Cookie', cookies)
			.expect(200)

		expect(updatedMeal.body.meal).toEqual(expect.objectContaining({
			name: 'café',
			in_diet: false,
			date: date.toISOString(),
		}))
	})

	it('should not be able to update a meal from another user by id', async () => {
		//user 1
		const user1 = await request(app.server)
			.post('/users')
			.send({
				name: 'John Doe',
				email: 'johndoe@testmail.com',
				password: '123456',
			}).expect(201)

		const cookies1 = user1.header['set-cookie']

		if (!cookies1) {
			throw new Error('Expected Set-Cookie header to be present')
		}
		
		//user 2
		const user2 = await request(app.server)
			.post('/users')
			.send({
				name: 'Mary Doe',
				email: 'marydoe@testmail.com',
				password: '123456',
			}).expect(201)

		const cookies2 = user2.header['set-cookie']

		if (!cookies2) {
			throw new Error('Expected Set-Cookie header to be present')
		}

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies1)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		const { id } = mealId.body

		await request(app.server)
			.put(`/meals/${id}`)
			.set('Cookie', cookies2)
			.send({
				name: 'café',
				description: 'tomo no café da manhã!',
				in_diet: false,
				date: date,
			})
			.expect(404)
	})

	//DELETE by Id -------------------------------------------------
	it('should be able to delete a meal by id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date,
			})
			.expect(201)
			
		const { id } = mealId.body

		await request(app.server)
			.del(`/meals/${id}`)
			.set('Cookie', cookies)
			.expect(204)

		const meals = await request(app.server)
			.get('/meals')
			.set('Cookie', cookies)
			.expect(200)

		expect(meals.body.meals.length).toEqual(1)
		expect(meals.body.meals).toEqual(expect.arrayContaining([
			expect.objectContaining({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: false,
				date: date.toISOString(),
			}),
		]))
	})

	it('should not be able to delete a meal by id without session id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)
			
		const { id } = mealId.body

		await request(app.server)
			.del(`/meals/${id}`)
			.expect(401)
	})

	it('should not be able to delete a meal by id without id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.del('/meals/id')
			.set('Cookie', cookies)
			.expect(400)
	})

	it('should not be able to delete a meal by id with a wrong id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.del('/meals/8d637889-9999-4239-9999-d11280baee45')
			.set('Cookie', cookies)
			.expect(404)
	})

	it('should not be able to delete a meal from another user by id', async () => {
		//user 1
		const user1 = await request(app.server)
			.post('/users')
			.send({
				name: 'John Doe',
				email: 'johndoe@testmail.com',
				password: '123456',
			}).expect(201)

		const cookies1 = user1.header['set-cookie']

		if (!cookies1) {
			throw new Error('Expected Set-Cookie header to be present')
		}
		
		//user 2
		const user2 = await request(app.server)
			.post('/users')
			.send({
				name: 'Mary Doe',
				email: 'marydoe@testmail.com',
				password: '123456',
			}).expect(201)

		const cookies2 = user2.header['set-cookie']

		if (!cookies2) {
			throw new Error('Expected Set-Cookie header to be present')
		}

		const date = new Date()

		const mealId = await request(app.server)
			.post('/meals')
			.set('Cookie', cookies1)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		const { id } = mealId.body

		await request(app.server)
			.del(`/meals/${id}`)
			.set('Cookie', cookies2)
			.expect(404)
	})

	//GET summary
	it('should be able to get a users summary', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'café',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)
		
		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'nutella',
				description: 'como no almoço',
				in_diet: false,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'arroz',
				description: 'como no almoço',
				in_diet: true,
				date: date,
			})
			.expect(201)

		const summary = await request(app.server)
			.get('/meals/summary')
			.set('Cookie', cookies)
			.expect(200)

		expect(summary.body.summary).toEqual({
			meals_length: 4,
			in_diet: 3,
			off_diet: 1,
			bestStreak: 2,
		})
	})

	it('should not be able to get a users summary without session id', async () => {
		const cookies = await createUserAndGetCookie()

		const date = new Date()

		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'cuscuz',
				description: 'tomo no café da manhã',
				in_diet: true,
				date: date,
			})
			.expect(201)
		
		await request(app.server)
			.post('/meals')
			.set('Cookie', cookies)
			.send({
				name: 'nutella',
				description: 'como no almoço',
				in_diet: false,
				date: date,
			})
			.expect(201)

		await request(app.server)
			.get('/meals/summary')
			.expect(401)
	})
})