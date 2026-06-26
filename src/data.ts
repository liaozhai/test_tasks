import { encodeFeatureCollection, Feature, FeatureCollection } from "./feature";
import fs from "fs";

function createFeatures(n: number) {
    const g = <Feature[]>[];
    for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        g.push(<Feature>{
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [x, y],
            },
        });
    }
    return g;
}

const NUMBER_OF_FEATURES = 1e7;

console.log("Generating sample data...");
let start = Date.now();
const features = createFeatures(NUMBER_OF_FEATURES);
const fc = {
    type: "FeatureCollection",
    features,
};
console.log(`Completed: ${(Date.now() - start) / 1000}s`);

console.log("Encoding feature collection...");
start = Date.now();
const b = encodeFeatureCollection(fc as FeatureCollection);
console.log(`Completed: ${(Date.now() - start) / 1000}s`);

console.log("Saving data file...");
start = Date.now();
const w = fs.createWriteStream("data.bin");
w.write(b);
w.end();
console.log(`Done: ${(Date.now() - start) / 1000}s. Bye!`);
