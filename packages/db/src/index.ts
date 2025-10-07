
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, accounts } from './schema'

const connectionString = process.env.DATABASE_URL

const client = postgres(connectionString, { prepare: false })
const db = drizzle(client);

const allUsers = await db.select().from(users);
        