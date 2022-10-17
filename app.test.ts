import { assertEquals } from "std/testing/asserts.ts";

import app from "@/app.ts";
import log from "@/utils.ts";

Deno.test("/_status endpoint", async () => {
    const res = await app.api.request("http://localhost/_status")
    assertEquals(res.status, 200)
    assertEquals(res.headers.get("content-type"), "application/json; charset=UTF-8")
    assertEquals(await res.text(), JSON.stringify({ status: "ok" }))
});

Deno.test("Not Found", async () => {
    const res = await app.api.request("http://localhost/foo")
    assertEquals(res.status, 404)
    assertEquals(await res.text(), "Not Found")
});

const dropDb = async (name: string) => {
    try {
        await Deno.remove(`${name}.db`);
    } catch (error) {
        log.error(`${error}`);
    }
};

Deno.test("Signup, login and fetch user info", async () => {
    await dropDb("test");

    app.database.initialise("test");

    // signup
    const signupResp = await app.api.request("http://localhost/api/users", {
        method: "POST",
        body:
            JSON.stringify({
                user: {
                    username: "test-user",
                    password: "test-pass",
                    email: "t@test.com"
                }
            })
    });

    // assert signup response
    const signup = await signupResp.json();
    assertEquals(signupResp.status, 200);
    assertEquals(signup,
        {
            user: {
                id: 1,
                username: 'test-user',
                email: "t@test.com",
                bio: null,
                image: null,
                token: signup.user.token
            }
        }
    );

    // login
    const loginResp = await app.api.request("http://localhost/api/users/login", {
        method: "POST",
        body:
            JSON.stringify({
                user: {
                    email: "t@test.com",
                    password: "test-pass"
                }
            })
    });

    // assert login response
    const loginUser = await loginResp.json();
    assertEquals(loginResp.status, 200);
    assertEquals(loginUser,
        {
            user: {
                id: 1,
                username: 'test-user',
                email: "t@test.com",
                bio: null,
                image: null,
                token: loginUser.user.token
            }
        }
    );

    // get user info
    const userResp = await app.api.request("http://localhost/api/user", {
        headers: {
            "Authorization": `Token ${loginUser.user.token}`
        },
    });

    // assert user response
    const user = await userResp.json();
    assertEquals(userResp.status, 200);
    assertEquals(user,
        {
            user: {
                id: 1,
                username: 'test-user',
                email: "t@test.com",
                bio: null,
                image: null,
                token: loginUser.user.token
            }
        }
    );

});