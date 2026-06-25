"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const parallel_1 = require("./parallel");
const featuresSchema = {
    type: "object",
    required: ["type", "geometry"],
    properties: {
        type: { type: "string", const: "Feature" },
        geometry: {
            type: "object",
            required: ["type", "coordinates"],
            properties: {
                type: {
                    type: "string",
                    enum: ["Point"],
                },
                coordinates: {
                    type: ["array"],
                },
            },
            additionalProperties: false,
        },
        properties: {
            type: ["object", "null"],
        },
        id: { type: ["string", "number", "null"] },
    },
    additionalProperties: false,
};
const fastify = (0, fastify_1.default)({ logger: true });
let store;
fastify.post("/load", {
    schema: {
        body: {
            type: "array",
            items: featuresSchema,
            minItems: 1,
        },
    },
}, async (request, reply) => {
    const features = request.body;
    if (!store) {
        store = new parallel_1.SpatialArray(features);
    }
    await store.createIndex();
    return { status: "indexed", count: features.length };
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
        const { minLon, minLat, maxLon, maxLat } = request.params;
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
fastify.post("/map", async (request, reply) => { });
fastify.post("/filter", async (request, reply) => { });
fastify.post("/reduce", async (request, reply) => { });
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