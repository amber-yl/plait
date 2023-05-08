import { MindmapLayoutType } from '@plait/layouts';
import { Path, PlaitElement, Point } from '@plait/core';
import { MindElement } from './element';

export interface MindmapNode {
    depth: number;
    x: number;
    y: number;
    width: number;
    height: number;
    hGap: number;
    vGap: number;
    children: MindmapNode[];
    origin: MindElement;
    parent: MindmapNode;
    left: boolean;
    up: boolean;
}

export const MindmapNode = {
    get(root: MindmapNode, path: Path) {
        let node = root;
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            if (!node || !node.children || !node.children[p]) {
                throw new Error(`Cannot find a descendant at path [${path}]`);
            }
            node = node.children[p];
        }
        return node;
    },
    isEquals(node: MindmapNode, otherNode: MindmapNode) {
        const hasSameSize =
            node.x === otherNode.x && node.y === otherNode.y && node.width === otherNode.width && node.height === otherNode.height;
        const hasSameOrigin = node.origin === otherNode.origin;
        let hasSameParentOriginChildren = false;
        if (node.parent && otherNode.parent) {
            hasSameParentOriginChildren = node.parent.origin.children == otherNode.parent.origin.children;
        }
        return hasSameSize && hasSameOrigin && hasSameParentOriginChildren;
    }
};

// mindmap node extend 支持的布局类型
export type ExtendLayoutType = Exclude<MindmapLayoutType, MindmapLayoutType.standard>;

export type CoordinateType = {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
};

export type ExtendUnderlineCoordinateType = {
    [key in ExtendLayoutType]: CoordinateType;
};

export type DetectResult = 'top' | 'bottom' | 'right' | 'left' | null;

export type RootBaseDirection = 'right' | 'left' | null;