import Fastify from "fastify";
import { SpatialArray } from "./parallel";
import { FeatureCollection, Feature, Point } from "geojson";
import fastifyMultiPart from "@fastify/multipart";

const fastify = Fastify({ logger: true });
fastify.register(fastifyMultiPart, {
    throwFileSizeLimit: false,
    limits: { fileSize: 1024e3 },
});

let store: SpatialArray | null = null;

function* getLines(buffer: Buffer, encoding: BufferEncoding = "utf8") {
    let start = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0x0a) {
            // \n
            yield buffer.toString(encoding, start, i);
            start = i + 1;
        } else if (buffer[i] === 0x0d && buffer[i + 1] === 0x0a) {
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
    const buf = await data!.toBuffer();

    const features = <Feature<Point>[]>[];

    for (const line of getLines(buf)) {
        const [x, y] = line.split(";");
        features.push(<Feature<Point>>{
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [+x, +y],
            },
        });
    }

    store = new SpatialArray(features);
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
