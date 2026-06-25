import Fastify from "fastify";
import { SpatialArray } from "./parallel";
import { Feature, Point, FeatureCollection } from "geojson";

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

const fastify = Fastify({ logger: true });

let store: SpatialArray;

fastify.post(
    "/load",
    {
        schema: {
            body: {
                type: "array",
                items: featuresSchema,
                minItems: 1,
            },
        },
    },
    async (request, reply) => {
        const features = request.body as Feature<Point>[];
        if (!store) {
            store = new SpatialArray(features);
        }
        await store.createIndex();
        return { status: "indexed", count: features.length };
    }
);

type BoundingBox = {
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
};

fastify.get(
    "/query",
    {
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
    },
    async (request, reply) => {
        if (store) {
            const { minLon, minLat, maxLon, maxLat } =
                request.params as BoundingBox;
            const features = store.query([minLon, minLat, maxLon, maxLat]);
            return {
                type: "FeatureCollection",
                features,
            } as FeatureCollection;
        } else {
            return [];
        }
    }
);

// fastify.post("/map", async (request, reply) => {});
// fastify.post("/filter", async (request, reply) => {});
// fastify.post("/reduce", async (request, reply) => {});

async function main() {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

main();
