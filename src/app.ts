import { Hono, Context } from "hono/mod.ts";
import { validator } from "hono/validator/index.ts";
import * as v from "https://deno.land/x/valibot@v0.13.1/mod.ts";
import { jwt } from "hono/middleware.ts";
import { Jwt } from "hono/utils/jwt/index.ts";
import { logger } from 'hono/middleware/logger/index.ts';

import userService from "@/user_service.ts";
import database from "@/database.ts";
import log from "@/utils.ts";

const api = new Hono();

api.use("*", logger());

const auth = jwt({ secret: 'it-is-very-secret' });

const getToken = (c: Context) => {
    const h = c.req.headers.get("authorization");
    return h?.split(" ")[1];
}

// status route
api.get("/_status", (c) => {
    return c.json({ status: "ok" }, 200);
});

// signup route
const signupSchema = v.object({
    user: v.object({
        username: v.string(),
        email: v.string([v.email()]),
        password: v.string(),
    })
});

type signupPayload = v.Input<typeof signupSchema>;

const validateSignup = validator('json', (value, c: Context) => {
    const parsed = v.safeParse(signupSchema, value);
    if (!parsed.success) {
        return c.text('Invalid!', 401)
    }
    return parsed.data
});

api.post("/api/users", validateSignup, async (c: Context) => {
    const payload: signupPayload = await c.req.json();
    const obj = await userService.create(payload.user);
    if (!obj) {
        return c.text("Bad Request", 400);
    }
    const token = await userService.createToken(obj.id);
    const user = { user: { ...obj, token } };
    return c.json(user, 200);
});

// login route
const loginSchema = v.object({
    user: v.object({
        email: v.string([v.email()]),
        password: v.string(),
    })
});

type loginPayload = v.Input<typeof loginSchema>;

const validateLogin = validator('json', (value, c: Context) => {
    const parsed = v.safeParse(loginSchema, value)
    if (!parsed.success) {
        return c.text('Invalid!', 401)
    }
    return parsed.data
});

api.post("/api/users/login", validateLogin, async (c: Context) => {
    const payload: loginPayload = await c.req.json();
    const obj = userService.login(payload.user);
    if (!obj) {
        return c.text("Unauthorized", 401);
    }
    const token = await userService.createToken(obj.id);
    const user = { user: { ...obj, token } }
    return c.json(user, 200);
});

// get user route
api.get("/api/user", auth, async (c) => {
    const token = getToken(c);
    if (!token) {
        return c.text("Bad Request", 400);
    }
    const { payload: { id } } = Jwt.decode(token);
    const user = await userService.getById(id);
    return c.json({ user: { ...user, token } }, 200);
});

api.notFound((c) => {
    return c.text("Not Found", 404);
});

api.onError((error, c) => {
    log.error(`${error}`);
    return c.json({ error: 'Internal Server Error', message: `${error}` }, 500);
});

export default {
    api,
    database
};
