import { Hono } from "hono/mod.ts"

const app = new Hono()

app.get("/", (c) => c.text("Hello! Hono!"))

export default app
