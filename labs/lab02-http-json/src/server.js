import http from "node:http";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 3000;

let requestCount = 0;

export function sendJson(res, statusCode, body) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(body));
}

export function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            if (body.trim() === "") {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error("Invalid JSON"));
            }
        });

        req.on("error", reject);
    });
}

export function handleCalculate(body) {
    if (!body.operation || body.a === undefined || body.b === undefined) {
        return {
            statusCode: 400,
            response: {
                error: "Missing required fields: operation, a, b"
            }
        };
    }
    if (typeof body.a !== "number" || typeof body.b !== "number") {
        return {
            statusCode: 400,
            response: {
                error: "Fields a and b must be numbers"
            }
        };
    }
    if (body.operation === "add") {
        return {
            statusCode: 200,
            response: {
                result: body.a + body.b
            }
        };
    }   else if (body.operation === "subtract") {
        return {
            statusCode: 200,
            response: {
                result: body.a - body.b
            }
        };
    } else if (body.operation === "multiply") {
        return {
            statusCode: 200,
            response: {
                result: body.a * body.b
            }
        };
    } else if (body.operation === "divide") {
        if (body.b === 0) {
            return {
                statusCode: 400,
                response: { 
                    error: "Division by zero is not allowed"
                }
            };
        }   else {
            return {
                statusCode: 200,
                response: {
                    result: body.a / body.b
                }
            };
        }
    } else { 
        return {
            statusCode: 400,
            response: {
                error: `Unsupported operation: ${body.operation}`
            }
        };
    }
}

export async function requestHandler(req, res) {
    requestCount += 1;

    const method = req.method;
    const url = req.url;

    if (method === "GET" && url === "/health") {
        sendJson(res, 200, { status: "ok" });
        return;
    }

    if (method === "GET" && url === "/requests") {
        sendJson(res, 200, { count: requestCount });
        return;
    }

    if (method === "POST" && url === "/echo") {
        try {
            const body = await readJsonBody(req);

            sendJson(res, 200, body);
        } catch {
            sendJson(res, 400, { error: "Invalid JSON" });
        }

        return;
    }

    if (method === "POST" && url === "/calculate") {
        try {
            const body = await readJsonBody(req);
            const result = handleCalculate(body);

            sendJson(res, result.statusCode, result.response);
        } catch {
            sendJson(res, 400, { error: "Invalid JSON" });
        }

        return;
    }

    sendJson(res, 404, { error: "Not found" });
}

export function createServer() {
    return http.createServer(requestHandler);
}

export function resetState() {
    requestCount = 0;
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
    const port = process.env.PORT || DEFAULT_PORT;
    const server = createServer();

    server.listen(port, () => {
        console.log(`HTTP JSON server listening on port ${port}`);
    });
}