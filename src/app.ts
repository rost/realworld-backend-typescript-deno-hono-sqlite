import { Hono, Context } from "hono/mod.ts";
import { validator } from "hono/middleware.ts";
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

api.get("/_status", (c) => {
    return c.json({ status: "ok" }, 200);
});

// signup route
const validateSignup = validator((v) => ({
    user: {
        username: v.json("user.username").isRequired(),
        email: v.json("user.email").isRequired(),
        password: v.json("user.password").isRequired(),
    },
}));

interface signupPayload {
    user: {
        username: string;
        email: string;
        password: string;
    }
}

api.post("/api/users", validateSignup, async (c) => {
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
const validateLogin = validator((v) => ({
    user: {
        email: v.json("user.email").isRequired(),
        password: v.json("user.password").isRequired(),
    },
}));

interface loginPayload {
    user: {
        email: string;
        password: string;
    }
}

api.post("/api/users/login", validateLogin, async (c) => {
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
