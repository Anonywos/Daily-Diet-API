export type Meal = {
	id: string
	user_id: string
	name: string
	description: string | null
	in_diet: boolean | number
	date: Date | number | string
	created_at: string
}

export type User = {
	id: string
	session_id: string
	name: string
	email: string
	password: string
	created_at: string
}