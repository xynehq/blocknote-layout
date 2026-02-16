import { BlockNoteEditor, BlockSchema, InlineContentSchema, StyleSchema } from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { FaPencilAlt } from "react-icons/fa";
import { asBlockNoteEditorForView } from "../../utils/editorUtils.js";

function insertWhiteboard<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema
>(editor: BlockNoteEditor<BSchema, ISchema, SSchema>): void {
    // Insert a whiteboard block using insertOrUpdateBlockForSlashMenu
    insertOrUpdateBlockForSlashMenu(
        asBlockNoteEditorForView(editor),
        { type: "whiteboard" }
    );
}

export function getWhiteboardSlashMenuItems<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema
>(
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
): DefaultReactSuggestionItem[] {
    // Check if whiteboard is in schema
    const checkWhiteboardBlocksInSchema = <
        B extends BlockSchema,
        I extends InlineContentSchema,
        S extends StyleSchema
    >(e: BlockNoteEditor<B, I, S>): boolean => {
        try {
            return e.schema && e.schema.blockSchema && "whiteboard" in e.schema.blockSchema;
        } catch {
            return false;
        }
    };

    if (!checkWhiteboardBlocksInSchema(editor)) {
        console.warn('Whiteboard block not found in schema');
        return [];
    }

    return [
        {
            title: "Whiteboard",
            subtext: "Create an infinite canvas for drawing and diagrams",
            group: "Diagrams",
            aliases: ["whiteboard", "canvas", "draw", "diagram", "sketch", "board"],
            icon: <FaPencilAlt size={18} />,
            onItemClick: (): void => {
                insertWhiteboard(editor);
            },
        },
    ];
}

export { insertWhiteboard };
