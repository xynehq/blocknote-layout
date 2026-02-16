import {
    BlockNoteEditor,
    BlockSchema,
    InlineContentSchema,
    StyleSchema,
} from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { createElement } from "react";
import { RiSparklingLine } from "react-icons/ri";
import { asBlockNoteEditorForView } from "../../utils/editorUtils.js";

function insertGenius<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, ISchema, SSchema>): void {
    insertOrUpdateBlockForSlashMenu(
        asBlockNoteEditorForView(editor),
        { type: "genius" },
    );
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
