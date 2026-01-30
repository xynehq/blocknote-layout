import {
    BlockNoteEditor,
    BlockSchema,
    InlineContentSchema,
    StyleSchema,
} from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { createElement } from "react";
import { RiUserLine } from "react-icons/ri";
import type { MentionProps } from "../blocks/schema.js";

/**
 * User type for mention suggestions
 */
export interface User {
    id: string;
    username: string;
    email: string;
    picture?: string;
}

/**
 * Callback function type for user search
 */
export type OnUserSearch = (query: string) => Promise<User[]>;

/**
 * Options for getting mention suggestion menu items
 */
export interface GetMentionSuggestionMenuItemsOptions {
    /**
     * Callback function to search for users
     */
    onUserSearch: OnUserSearch;
    /**
     * Current user ID to filter out self-mentions from suggestions (optional)
     */
    currentUserId?: string;
}

/**
 * Check if mention inline content is in the schema
 */
function checkMentionInSchema<
    B extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
>(editor: BlockNoteEditor<B, I, S>): boolean {
    try {
        return (
            editor.schema &&
            editor.schema.inlineContentSchema &&
            "mention" in editor.schema.inlineContentSchema
        );
    } catch {
        return false;
    }
}

/**
 * Group type for group mention suggestions
 */
export interface Group {
    id: string;
    name: string;
    alias?: string | null;
}

/**
 * Insert a user mention inline content at the current cursor position
 */
function insertMention<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
    user: User
): void {
    const mentionProps: MentionProps = {
        userId: user.id,
        username: user.username,
        userEmail: user.email,
        userPicture: user.picture || "",
    };

    editor.insertInlineContent([
        {
            type: "mention" as const,
            props: mentionProps,
        } as any,
        " ",
    ]);
}

/**
 * Insert a group mention inline content at the current cursor position.
 * Backend should expand group to member user IDs when sending notifications.
 */
export function insertGroupMention<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
    group: Group
): void {
    const mentionProps: MentionProps = {
        userId: "",
        username: "",
        userEmail: "",
        userPicture: "",
        groupId: group.id,
        groupName: group.name,
    };

    editor.insertInlineContent([
        {
            type: "mention" as const,
            props: mentionProps,
        } as any,
        " ",
    ]);
}

/**
 * Get mention suggestion menu items for use with SuggestionMenuController
 * 
 * This function should be used with SuggestionMenuController like:
 * ```tsx
 * <SuggestionMenuController
 *   triggerCharacter="@"
 *   getItems={async (query) => {
 *     return getMentionSuggestionMenuItems(editor, query, {
 *       onUserSearch: async (q) => {
 *         const response = await fetch(`/api/users/search?q=${q}`);
 *         return response.json();
 *       },
 *     });
 *   }}
 * />
 * ```
 * 
 * Or use the convenience function `createMentionSuggestionMenuItems`:
 * ```tsx
 * <SuggestionMenuController
 *   triggerCharacter="@"
 *   getItems={createMentionSuggestionMenuItems(editor, {
 *     onUserSearch: async (q) => {
 *       const response = await fetch(`/api/users/search?q=${q}`);
 *       return response.json();
 *     },
 *   })}
 * />
 * ```
 */
export async function getMentionSuggestionMenuItems<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
    query: string,
    options: GetMentionSuggestionMenuItemsOptions
): Promise<DefaultReactSuggestionItem[]> {
    // Check if mention is in schema
    if (!checkMentionInSchema(editor)) {
        console.warn("Mention inline content not found in schema");
        return [];
    }

    const { onUserSearch, currentUserId } = options;

    // Search for users
    let users: User[];
    try {
        users = await onUserSearch(query);
    } catch (error) {
        console.error("Error searching for users:", error);
        return [];
    }

    // Filter out current user if specified
    const filteredUsers = currentUserId
        ? users.filter((user) => user.id !== currentUserId)
        : users;

    // Map users to suggestion items
    return filteredUsers.map((user) => ({
        title: user.username,
        subtext: user.email,
        group: "Users",
        icon: createElement(RiUserLine, { size: 18 }),
        onItemClick: () => {
            insertMention(editor, user);
        },
    }));
}

/**
 * Convenience function that returns a getItems callback for SuggestionMenuController
 * 
 * Usage:
 * ```tsx
 * <SuggestionMenuController
 *   triggerCharacter="@"
 *   getItems={createMentionSuggestionMenuItems(editor, {
 *     onUserSearch: async (q) => {
 *       const response = await fetch(`/api/users/search?q=${q}`);
 *       return response.json();
 *     },
 *   })}
 * />
 * ```
 */
export function createMentionSuggestionMenuItems<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
    options: GetMentionSuggestionMenuItemsOptions
): (query: string) => Promise<DefaultReactSuggestionItem[]> {
    return async (query: string) => {
        return getMentionSuggestionMenuItems(editor, query, options);
    };
}
