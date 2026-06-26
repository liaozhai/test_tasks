"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
function createFeatures(n) {
    const g = [];
    for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        g.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [x, y],
            },
        });
    }
    return g;
}
async function* generateFeatures(n) {
    for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        yield {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [x, y],
            },
        };
    }
}
const NUMBER_OF_FEATURES = 1e7;
async function main() {
    const w = fs_1.default.createWriteStream("data.txt");
    for (let i = 0; i < NUMBER_OF_FEATURES; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        w.write(`${x};${y}`);
        w.write("\n");
    }
    w.end();
}
main();
//# sourceMappingURL=data.js.map