import {
    BlockNoteSchema,
    defaultBlockSpecs,
    BlockSpecs,
    BlockNoteEditor,
    BlockSchema,
    InlineContentSchema,
    StyleSchema,
} from "@blocknote/core";
import { WhiteboardBlock } from "./WhiteboardBlock.js";

export const whiteboardBlockSpecs = {
    whiteboard: WhiteboardBlock,
} as const;

export const whiteboardSchema = BlockNoteSchema.create({
    blockSpecs: whiteboardBlockSpecs,
});

export function createWhiteboardSchema<T extends BlockSpecs>(
    customBlockSpecs?: T,
) {
    const allBlockSpecs = {
        ...defaultBlockSpecs,
        ...whiteboardBlockSpecs,
        ...(customBlockSpecs || {}),
    };

    return BlockNoteSchema.create({
        blockSpecs: allBlockSpecs,
    } as Parameters<typeof BlockNoteSchema.create>[0]);
}

export function withWhiteboard<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends BlockNoteSchema<any, any, any>
>(schema: T): T {
    return schema.extend({
        blockSpecs: whiteboardBlockSpecs,
    }) as T;
}

export function checkWhiteboardBlocksInSchema(
    editor: BlockNoteEditor<BlockSchema, InlineContentSchema, StyleSchema>
): boolean {
    return (
        "whiteboard" in editor.schema.blockSchema
    );
}
