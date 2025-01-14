import {
    PlaitBoard,
    getSelectedElements,
    getSelectedGroups,
    PlaitElement,
    PlaitGroupElement,
    findLastIndex,
    getEditingGroup,
    getGroupByElement,
    PlaitGroup,
    getElementsInGroup,
    Transforms,
    Path,
    findIndex
} from '@plait/core';

export interface ZIndexMoveOption {
    element: PlaitElement;
    newPath: Path;
}

export const moveElementsToNewPath = (board: PlaitBoard, zIndexMoveOption: ZIndexMoveOption[]) => {
    zIndexMoveOption
        .map(item => {
            const path = PlaitBoard.findPath(board, item.element);
            const ref = board.pathRef(path);
            return () => {
                ref.current && Transforms.moveNode(board, ref.current, item.newPath);
                ref.unref();
            };
        })
        .forEach(action => {
            action();
        });
};

export const getOneMoveOptions = (board: PlaitBoard, direction: 'down' | 'up'): ZIndexMoveOption[] => {
    const indicesToMove = getIndicesToMove(board);
    let groupedIndices = toContiguousGroups(board, indicesToMove);
    if (direction === 'up') {
        groupedIndices = groupedIndices.reverse();
    }
    let moveContents: ZIndexMoveOption[] = [];
    groupedIndices.forEach((indices, i) => {
        const leadingIndex = indices[0];
        const trailingIndex = indices[indices.length - 1];
        const boundaryIndex = direction === 'down' ? leadingIndex : trailingIndex;
        const targetIndex = getTargetIndex(board, boundaryIndex, direction);
        if (targetIndex === -1 || boundaryIndex === targetIndex) {
            return;
        }
        if (direction === 'down') {
            moveContents.push(
                ...indices.reverse().map(path => {
                    return {
                        element: board.children[path],
                        newPath: [targetIndex]
                    };
                })
            );
        } else {
            moveContents.push(
                ...indices.map(path => {
                    return {
                        element: board.children[path],
                        newPath: [targetIndex]
                    };
                })
            );
        }
    });

    return moveContents;
};

const getIndicesToMove = (board: PlaitBoard) => {
    const selectedElements = [...getSelectedElements(board), ...getSelectedGroups(board)];
    return selectedElements
        .map(item => {
            return board.children.indexOf(item);
        })
        .sort((a, b) => {
            return a - b;
        });
};

const toContiguousGroups = (board: PlaitBoard, array: number[]) => {
    let cursor = 0;
    return array.reduce((acc, value, index) => {
        if (index > 0) {
            const currentElement = board.children[value];
            const previousElement = board.children[array[index - 1]];
            const isInSameGroup = currentElement.groupId === previousElement.groupId;
            const isContain = currentElement.id === previousElement.groupId || currentElement.groupId === previousElement.id;
            if (array[index - 1] !== value - 1 || (!isInSameGroup && !isContain)) {
                cursor = ++cursor;
            }
        }
        (acc[cursor] || (acc[cursor] = [])).push(value);
        return acc;
    }, [] as number[][]);
};

/**
 * Returns next candidate index that's available to be moved to. Currently that
 *  is a non-deleted element, and not inside a group (unless we're editing it).
 */
const getTargetIndex = (board: PlaitBoard, boundaryIndex: number, direction: 'down' | 'up') => {
    if ((boundaryIndex === 0 && direction === 'down') || (boundaryIndex === board.children.length - 1 && direction === 'up')) {
        return -1;
    }
    const indexFilter = (element: PlaitElement) => {
        if (element.isDeleted || PlaitGroupElement.isGroup(element)) {
            return false;
        }
        return true;
    };
    const candidateIndex =
        direction === 'down'
            ? findLastIndex(board.children, el => indexFilter(el), Math.max(0, boundaryIndex - 1))
            : findIndex(board.children, el => indexFilter(el), boundaryIndex + 1);

    const nextElement = board.children[candidateIndex];
    if (!nextElement) {
        return -1;
    }

    if (!nextElement.groupId) {
        return candidateIndex;
    }

    const elements = [...board.children];
    const sourceElement = elements[boundaryIndex];
    const editingGroup = getEditingGroup(board, sourceElement);
    const nextElementGroups = (getGroupByElement(board, nextElement, true) || []) as PlaitGroup[];
    // candidate element is a sibling in current editing group → return
    if (editingGroup && sourceElement?.groupId !== nextElement?.groupId) {
        // candidate element is outside current editing group → prevent
        if (!(nextElementGroups as PlaitGroup[]).find(item => item.id === editingGroup.id)) {
            return -1;
        }
    }
    let siblingGroup: PlaitGroup;
    if (editingGroup) {
        siblingGroup = nextElementGroups[nextElementGroups.indexOf(editingGroup) - 1];
    } else {
        siblingGroup = nextElementGroups[nextElementGroups.length - 1];
    }
    if (siblingGroup) {
        let elementsInSiblingGroup = getElementsInGroup(board, siblingGroup, true, true);
        if (elementsInSiblingGroup.length) {
            elementsInSiblingGroup = [...elementsInSiblingGroup, siblingGroup];
            elementsInSiblingGroup.sort((a, b) => {
                const indexA = board.children.findIndex(child => child.id === a.id);
                const indexB = board.children.findIndex(child => child.id === b.id);
                return indexA - indexB;
            });
            // assumes getElementsInGroup() returned elements are sorted
            // by zIndex (ascending)
            return direction === 'down'
                ? elements.indexOf(elementsInSiblingGroup[0])
                : elements.indexOf(elementsInSiblingGroup[elementsInSiblingGroup.length - 1]);
        }
    }

    return candidateIndex;
};
