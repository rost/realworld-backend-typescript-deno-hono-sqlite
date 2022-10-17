import { assertEquals } from "std/testing/asserts.ts"

import app from "@/app.ts"

Deno.test("Hello! Hono!", async () => {
  const res = await app.request("http://localhost/")
  assertEquals(res.status, 200)
  assertEquals(await res.text(), "Hello! Hono!")
})

Deno.test("Not Found", async () => {
  const res = await app.request("http://localhost/foo")
  assertEquals(res.status, 404)
  assertEquals(await res.text(), "404 Not Found")
})
