import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { MdSlideshow } from "react-icons/md";

type AnyBlockNoteEditor = BlockNoteEditor<any, any, any>;

function insertSlideshow(editor: AnyBlockNoteEditor, canvasId?: string): void {
  // Insert a slideshow block using BlockNote's API
  editor.insertBlocks(
    [
      {
        type: "slideshow",
        props: {
          canvasId: canvasId || null,
          title: "Slideshow",
        },
      } as any,
    ],
    editor.getTextCursorPosition().block,
    "after"
  );
}

export function getSlideshowSlashMenuItems(
  editor: AnyBlockNoteEditor,
): DefaultReactSuggestionItem[] {
  // Check if slideshow is in schema
  const checkSlideshowBlocksInSchema = (e: AnyBlockNoteEditor): boolean => {
    return "slideshow" in e.schema.blockSchema;
  };

  if (!checkSlideshowBlocksInSchema(editor)) {
    console.warn('Slideshow block not found in schema');
    return [];
  }

  return [
    {
      title: "Slideshow",
      subtext: "Create a presentation from canvas content",
      group: "Presentations",
      aliases: ["slideshow", "presentation", "slides", "deck", "present"],
      icon: <MdSlideshow size={18} />,
      onItemClick: () => {
        insertSlideshow(editor);
      },
    },
  ];
}

export { insertSlideshow };
