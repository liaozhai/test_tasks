import Fastify from "fastify";
import { SpatialArray } from "./parallel";
import { Feature, FeatureCollection, Point } from "geojson";
import { decodeFeatureCollection } from "./feature";
import fp from "fastify-plugin";
import mp from "@fastify/multipart";

const fastify = Fastify({ logger: true });

fastify.register(fp(mp));

let store: SpatialArray | null = null;

fastify.post("/load", async (request, reply) => {
    const data = await request.file();
    if (!data) {
        return { error: "Error" };
    }
    const chunks = [];
    for await (const chunk of data.file) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const fc = decodeFeatureCollection(buffer);
    store = new SpatialArray(<Feature<Point>[]>fc.features);
    await store.createIndex();

    return { status: "indexed", count: store.count };
});

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
                request.query as BoundingBox;
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
