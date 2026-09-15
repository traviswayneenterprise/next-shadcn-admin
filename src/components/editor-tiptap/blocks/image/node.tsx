"use client";

// Adapted from Scibly's blocks/media/custom-image/node.ts - same node
// shape (atom, draggable, resizable via width/height attrs), with the
// addHtmlSchemaAwareness() metadata stripped (their AI-notebook feature,
// which we don't have) and a simplified NodeView (plain <img>, no
// drag-resize handles yet - that's a real feature worth adding later,
// not needed to prove the block works).

import { mergeAttributes, Node, type NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

export interface ImageAttributes {
  src: string;
  alt: string;
  width: number | "inherit";
  height: number | "inherit";
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      insertImage: (attrs: { src: string; alt?: string }) => ReturnType;
    };
  }
}

function ImageComponent({ node }: NodeViewProps) {
  const { src, alt, width, height } = node.attrs as ImageAttributes;
  return (
    <NodeViewWrapper className="flex justify-center py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        style={{
          maxWidth: "100%",
          borderRadius: "0.75rem",
          width: width === "inherit" ? undefined : width,
          height: height === "inherit" ? undefined : height,
        }}
      />
    </NodeViewWrapper>
  );
}

export const Image = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      width: { default: "inherit" },
      height: { default: "inherit" },
    };
  },

  parseHTML() {
    return [{ tag: "img" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { src: HTMLAttributes.src, alt: HTMLAttributes.alt })];
  },

  addCommands() {
    return {
      insertImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src: attrs.src, alt: attrs.alt ?? "" } }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});

export default Image;
