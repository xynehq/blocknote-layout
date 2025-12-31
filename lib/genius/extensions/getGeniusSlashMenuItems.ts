import {
    BlockNoteEditor,
    BlockSchema,
    InlineContentSchema,
    StyleSchema,
    insertOrUpdateBlock,
} from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { createElement } from "react";
import { RiSparklingLine } from "react-icons/ri";

function insertGenius<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, ISchema, SSchema>): void {
    insertOrUpdateBlock(
        editor as unknown as BlockNoteEditor<BlockSchema, InlineContentSchema, StyleSchema>,
        { type: "genius" },
    );

    const currentBlock = editor.getTextCursorPosition().block;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    editor.insertBlocks([{ type: "paragraph" as any }], currentBlock as any, "after");
}

export function getGeniusSlashMenuItems<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, ISchema, SSchema>): DefaultReactSuggestionItem[] {
    // Check if genius is in schema
    const checkGeniusBlockInSchema = <
        B extends BlockSchema,
        I extends InlineContentSchema,
        S extends StyleSchema,
    >(
        e: BlockNoteEditor<B, I, S>,
    ): boolean => {
        try {
            return e.schema && e.schema.blockSchema && "genius" in e.schema.blockSchema;
        } catch {
            return false;
        }
    };

    if (!checkGeniusBlockInSchema(editor)) {
        console.warn("Genius block not found in schema");
        return [];
    }

    return [
        {
            title: "Genius",
            subtext: "Insert AI-generated content, charts, and data visualizations",
            group: "AI",
            aliases: ["genius", "ai", "chart", "data", "visualization", "bot"],
            icon: createElement(RiSparklingLine, { size: 18 }),
            onItemClick: (): void => {
                insertGenius(editor);
            },
        },
    ];
}

export { insertGenius };
