import { PlaitBoard, PlaitElement, getSelectedElements } from '@plait/core';
import { isVirtualKey, isSpaceHotkey, isDelete } from '@plait/common';
import { GeometryComponent } from '../geometry.component';
import { PlaitDrawElement } from '../interfaces';
import { getSelectedGeometryElements } from '../utils';

export const withDrawHotkey = (board: PlaitBoard) => {
    const { keydown, dblclick } = board;

    board.keydown = (event: KeyboardEvent) => {
        const selectedElements = getSelectedElements(board);
        const isSingleSelection = selectedElements.length === 1;
        const targetElement = selectedElements[0];
        if (
            !PlaitBoard.isReadonly(board) &&
            !isVirtualKey(event) &&
            !isDelete(event) &&
            !isSpaceHotkey(event) &&
            isSingleSelection &&
            PlaitDrawElement.isGeometry(targetElement)
        ) {
            event.preventDefault();
            (PlaitElement.getComponent(targetElement) as GeometryComponent).editText();
            return;
        }

        keydown(event);
    };

    board.dblclick = (event: MouseEvent) => {
        event.preventDefault();
        const geometries = getSelectedGeometryElements(board);
        if (!PlaitBoard.isReadonly(board) && geometries.length === 1) {
            const component = PlaitElement.getComponent(geometries[0]) as GeometryComponent;
            component.editText();
        }
        dblclick(event);
    };
    return board;
};
