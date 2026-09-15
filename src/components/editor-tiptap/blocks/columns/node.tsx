// Adapted from Scibly's blocks/column/nodes/column.ts + columns.ts - both
// are self-contained structural nodes (no React component needed, unlike
// the other blocks here), just plain div-based ProseMirror nodes with
// parseHTML/renderHTML and a couple of keyboard shortcuts. Simplified to a
// single fixed two-column layout instead of their ColumnLayout enum
// (SidebarLeft/SidebarRight/TwoColumn) - one layout is enough to prove the
// block works; more layouts are a config change, not a new architecture.

import { mergeAttributes, Node } from "@tiptap/core";

export const Column = Node.create({
  name: "column",
  content: "block+",
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "column", class: "min-w-0" }), 0];
  },
});

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: "column column",

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "columns",
        class: "grid grid-cols-2 gap-4 my-2",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertColumns:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [
              { type: "column", content: [{ type: "paragraph" }] },
              { type: "column", content: [{ type: "paragraph" }] },
            ],
          }),
    };
  },

});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      insertColumns: () => ReturnType;
    };
  }
}

export default Columns;
