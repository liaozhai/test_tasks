"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const parallel_1 = require("./parallel");
const multipart_1 = __importDefault(require("@fastify/multipart"));
const fastify = (0, fastify_1.default)({ logger: true });
fastify.register(multipart_1.default, {
    throwFileSizeLimit: false,
    limits: { fileSize: 1024e3 },
});
let store = null;
function* getLines(buffer, encoding = "utf8") {
    let start = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0x0a) {
            // \n
            yield buffer.toString(encoding, start, i);
            start = i + 1;
        }
        else if (buffer[i] === 0x0d && buffer[i + 1] === 0x0a) {
            // \r\n
            yield buffer.toString(encoding, start, i);
            start = i + 2;
            i++;
        }
    }
    if (start < buffer.length) {
        yield buffer.toString(encoding, start);
    }
}
fastify.post("/load", async (request, reply) => {
    const data = await request.file({
        throwFileSizeLimit: false,
        limits: { fileSize: 100 * 1024 * 1024 },
    });
    const buf = await data.toBuffer();
    const features = [];
    for (const line of getLines(buf)) {
        const [x, y] = line.split(";");
        features.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [+x, +y],
            },
        });
    }
    store = new parallel_1.SpatialArray(features);
    await store.createIndex();
    return { status: "indexed", count: store.count };
});
fastify.get("/query", {
    schema: {
        querystring: {
            type: "object",
            properties: {
                minLon: {
                    type: "integer",
                },
                minLat: {
                    type: "integer",
                },
                maxLon: {
                    type: "integer",
                },
                maxLat: {
                    type: "integer",
                },
            },
        },
    },
}, async (request, reply) => {
    if (store) {
        const { minLon, minLat, maxLon, maxLat } = request.query;
        const features = store.query([minLon, minLat, maxLon, maxLat]);
        return {
            type: "FeatureCollection",
            features,
        };
    }
    else {
        return [];
    }
});
// fastify.post("/map", async (request, reply) => {});
// fastify.post("/filter", async (request, reply) => {});
// fastify.post("/reduce", async (request, reply) => {});
async function main() {
    try {
        await fastify.listen({ port: 3000 });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=server.js.map