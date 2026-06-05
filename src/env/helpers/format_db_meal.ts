//Helper that formatted a meal from database
import type { Meal } from '../../types/database.js'

export default function formatDBMeal(meal: Meal): Meal {
	return {
		...meal,
		in_diet: Boolean(meal.in_diet),
		date: new Date(meal.date).toISOString(),
	}
}