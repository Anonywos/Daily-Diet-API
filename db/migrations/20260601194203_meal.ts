import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('meals', (table) => {
		table.uuid('id').primary()
		table.uuid('user_id').notNullable().index()
		table.string('name').notNullable()
		table.text('description')
		table.boolean('in_diet').notNullable()
		table.timestamp('date').notNullable()
		table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
	})
}


export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('meals')
}

