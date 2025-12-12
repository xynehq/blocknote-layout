import {
  BlockNoteSchema,
  defaultBlockSpecs,
  BlockSpecs,
} from "@blocknote/core";
import { SlideBlock, SlideshowBlock } from "./SlideshowBlocks.js";

export const slideshowBlockSpecs = {
  slide: SlideBlock,
  slideshow: SlideshowBlock,
} as const;

export const slideshowSchema = BlockNoteSchema.create({
  blockSpecs: slideshowBlockSpecs,
});

export function createSlideshowSchema<T extends BlockSpecs>(
  customBlockSpecs?: T,
) {
  const allBlockSpecs = {
    ...defaultBlockSpecs,
    ...slideshowBlockSpecs,
    ...(customBlockSpecs || {}),
  };

  return BlockNoteSchema.create({
    blockSpecs: allBlockSpecs,
  } as Parameters<typeof BlockNoteSchema.create>[0]);
}

export function withSlideshow<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends BlockNoteSchema<any, any, any>
>(schema: T): T {
  return schema.extend({
    blockSpecs: slideshowBlockSpecs,
  }) as T;
}

export function checkSlideshowBlocksInSchema(
  editor: any
): boolean {
  return (
    "slideshow" in editor.schema.blockSchema &&
    "slide" in editor.schema.blockSchema
  );
}