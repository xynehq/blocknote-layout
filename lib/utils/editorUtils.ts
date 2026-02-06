import {
    BlockNoteEditor,
    BlockSchema,
    InlineContentSchema,
    StyleSchema,
} from "@blocknote/core";

/**
 * Cast a BlockNote editor (e.g. with custom schema including mention, whiteboard, genius, etc.) 
 * to the type expected by BlockNoteView and by APIs that use default schema types.
 * 
 * Use when you create an editor with custom schema extensions like:
 * - BlockNoteSchema.create().extend({ inlineContentSpecs: { mention } })
 * - BlockNoteSchema.create().extend({ blockSpecs: { whiteboard, genius } })
 * 
 * And need to pass it to BlockNoteView or APIs that expect default schema types.
 * 
 * @example
 * ```tsx
 * const schema = BlockNoteSchema.create().extend({
 *   inlineContentSpecs: { mention: mentionInlineContentSpec }
 * });
 * const editor = useCreateBlockNote({ schema });
 * const editorForView = asBlockNoteEditorForView(editor);
 * <BlockNoteView editor={editorForView} />
 * ```
 */
export function asBlockNoteEditorForView<
    B extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
>(
    editor: BlockNoteEditor<B, I, S>
): BlockNoteEditor<BlockSchema, InlineContentSchema, StyleSchema> {
    return editor as unknown as BlockNoteEditor<
        BlockSchema,
        InlineContentSchema,
        StyleSchema
    >;
}
