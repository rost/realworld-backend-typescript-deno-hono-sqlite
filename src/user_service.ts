import { Jwt } from "hono/utils/jwt/index.ts";
import { AlgorithmTypes } from "hono/utils/jwt/types.ts";
import * as bcrypt from "bcrypt";

import { DB, RowObject } from "sqlite";

import database from "@/database.ts";
import log from "@/utils.ts";

export interface User extends RowObject {
    id: string;
    username: string;
    email: string;
    bio?: string;
    image?: string;
}

const create = async (userPayload: { username: string; password: string, email: string }) => {
    const db = new DB(database.config.name, { mode: "create" });
    const { username, password, email } = userPayload;

    const hash = await bcrypt.hash(password);

    let res;
    try {
        res = db.queryEntries<User>("INSERT INTO users (username, password, email) VALUES (?, ?, ?) RETURNING *", [username, hash, email]);
    } catch (error) {
        log.error(`${error}`);
    }

    if (db.changes !== 1 || !res) {
        db.close();
        return
    }

    const user = toUser(res[0]);

    db.close();
    return user;
};

const login = (userCredentials: { email: string; password: string }) => {
    const db = new DB(database.config.name, { mode: "read" });
    const { email, password } = userCredentials;

    const res = db.queryEntries<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (res.length === 0) {
        db.close();
        return
    }

    const storedPass = res[0][2] as string;

    const valid = verifyPassword(password, storedPass);
    if (!valid) {
        db.close();
        return
    }

    const user = toUser(res[0]);

    db.close();
    return user;
};

const getById = (id: number) => {
    const db = new DB(database.config.name, { mode: "read" });
    const res = db.queryEntries<User>("SELECT * FROM users WHERE id = ?", [id]);
    if (res.length === 0) {
        db.close();
        return
    }

    db.close();

    const user = toUser(res[0]);
    return user;
};

const toUser = (rawUser: User): User => {
    // deno-lint-ignore no-unused-vars
    const { password, ...user } = rawUser;
    return user as User;
};

const createToken = async (id: string) => {
    const jwt = await Jwt.sign({ id }, "it-is-very-secret", AlgorithmTypes.HS256);
    return jwt;
};

const verifyPassword = (password: string, hash: string) => {
    const res = bcrypt.compareSync(password, hash);
    if (!res) {
        return { error: "password is incorrect" };
    }
    return res;
};

export default {
    create,
    login,
    getById,
    createToken,
};