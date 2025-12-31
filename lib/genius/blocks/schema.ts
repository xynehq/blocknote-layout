import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { GeniusBlock } from "./GeniusBlock.js";

export const geniusBlockSpecs = {
    genius: GeniusBlock,
} as const;

export function createGeniusSchema() {
    return BlockNoteSchema.create({
        blockSpecs: {
            ...defaultBlockSpecs,
            ...geniusBlockSpecs,
        },
    });
}

export function withGenius<T extends typeof defaultBlockSpecs>(blockSpecs: T) {
    return {
        ...blockSpecs,
        ...geniusBlockSpecs,
    };
}

export const geniusSchema = createGeniusSchema();
