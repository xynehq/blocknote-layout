import { CustomInlineContentConfig } from "@blocknote/core";

export interface MentionProps {
    userId: string;
    username: string;
    userEmail: string;
    userPicture: string;
    groupId?: string;
    groupName?: string;
}

export const mentionConfig = {
    type: "mention",
    propSchema: {
        userId: {
            default: "",
        },
        username: {
            default: "",
        },
        userEmail: {
            default: "",
        },
        userPicture: {
            default: "",
        },
        groupId: {
            default: "",
        },
        groupName: {
            default: "",
        },
    },
    content: "none",
} as const satisfies CustomInlineContentConfig;

/**
 * Resolves the visible label for a mention: the group name for group mentions,
 * otherwise the username. Shared so the browser and server renders stay in sync.
 */
export function getMentionDisplayName(props: MentionProps): string {
    return props.groupId && props.groupName ? props.groupName : props.username || "";
}
