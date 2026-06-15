import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
    createServer,
    resetState,
    handleCalculate
} from "../src/server.js";

let server;
let baseUrl;

beforeEach(async () => {
    resetState();

    server = createServer();

    await new Promise(resolve => {
        server.listen(0, () => {
            const address = server.address();
            baseUrl = `http://127.0.0.1:${address.port}`;
            resolve();
        });
    });
});

afterEach(async () => {
    await new Promise(resolve => {
        server.close(resolve);
    });
});

async function getJson(path) {
    const response = await fetch(`${baseUrl}${path}`);
    const body = await response.json();

    return {
        status: response.status,
        body
    };
}

async function postJson(path, data) {
    const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const body = await response.json();

    return {
        status: response.status,
        body
    };
}

async function postRaw(path, rawBody) {
    const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: rawBody
    });

    const body = await response.json();

    return {
        status: response.status,
        body
    };
}

describe("Lab 2 HTTP JSON server", () => {
    test("GET /health returns status ok", async () => {
        const result = await getJson("/health");

        expect(result.status).toBe(200);
        expect(result.body).toEqual({
            status: "ok"
        });
    });

    test("unknown route returns 404", async () => {
        const result = await getJson("/missing");

        expect(result.status).toBe(404);
        expect(result.body).toHaveProperty("error");
    });

    test("POST /echo returns the submitted JSON body", async () => {
        const result = await postJson("/echo", {
            message: "hello"
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual({
            message: "hello"
        });
    });

    test("POST /echo rejects invalid JSON", async () => {
        const result = await postRaw("/echo", "{ bad json");

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
    });

    test("POST /calculate can add two numbers", async () => {
        const result = await postJson("/calculate", {
            operation: "add",
            a: 2,
            b: 3
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual({
            result: 5
        });
    });

    test("POST /calculate can subtract two numbers", async () => {
        const result = await postJson("/calculate", {
            operation: "subtract",
            a: 10,
            b: 4
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual({
            result: 6
        });
    });

    test("POST /calculate can multiply two numbers", async () => {
        const result = await postJson("/calculate", {
            operation: "multiply",
            a: 6,
            b: 7
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual({
            result: 42
        });
    });

    test("POST /calculate can divide two numbers", async () => {
        const result = await postJson("/calculate", {
            operation: "divide",
            a: 20,
            b: 5
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual({
            result: 4
        });
    });

    test("POST /calculate rejects division by zero", async () => {
        const result = await postJson("/calculate", {
            operation: "divide",
            a: 20,
            b: 0
        });

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
    });

    test("POST /calculate rejects unsupported operations", async () => {
        const result = await postJson("/calculate", {
            operation: "power",
            a: 2,
            b: 3
        });

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
    });

    test("POST /calculate rejects missing fields", async () => {
        const result = await postJson("/calculate", {
            operation: "add",
            a: 2
        });

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
    });

    test("POST /calculate rejects non-number values", async () => {
        const result = await postJson("/calculate", {
            operation: "add",
            a: "two",
            b: 3
        });

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
    });

    test("GET /requests returns a request count", async () => {
        await getJson("/health");
        const result = await getJson("/requests");

        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty("count");
        expect(typeof result.body.count).toBe("number");
        expect(result.body.count).toBeGreaterThanOrEqual(2);
    });
});

describe("handleCalculate", () => {
    test("handleCalculate returns add result", () => {
        const result = handleCalculate({
            operation: "add",
            a: 2,
            b: 3
        });

        expect(result).toEqual({
            statusCode: 200,
            response: {
                result: 5
            }
        });
    });
});