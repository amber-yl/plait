import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, forwardRef } from '@angular/core';
import {
    OnBoardChange,
    PlaitBoard,
    PlaitElement,
    PlaitIslandBaseComponent,
    PlaitPointerType,
    Transforms,
    getSelectedElements,
    getSelectionAngle,
    degreesToRadians,
    radiansToDegrees,
    rotateElements,
    hasSameAngle
} from '@plait/core';
import {
    DrawTransforms,
    GeometryShapes,
    LineHandleKey,
    LineMarkerType,
    LineShape,
    getMemorizeKey,
    getSelectedGeometryElements,
    getSelectedImageElements,
    getSelectedLineElements
} from '@plait/draw';
import { MindLayoutType } from '@plait/layouts';
import {
    MindElement,
    MindPointerType,
    MindTransforms,
    canSetAbstract,
    getDefaultMindElementFontSize,
    getSelectedMindElements
} from '@plait/mind';
import { FontSizes, PlaitMarkEditor, MarkTypes, CustomText, LinkEditor, AlignEditor, Alignment } from '@plait/text';
import { Node, Transforms as SlateTransforms } from 'slate';
import { AppColorPickerComponent } from '../color-picker/color-picker.component';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { AlignTransform, PropertyTransforms, TextTransforms, getFirstTextEditor, getTextEditors } from '@plait/common';

@Component({
    selector: 'app-setting-panel',
    templateUrl: './setting-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: PlaitIslandBaseComponent, useExisting: forwardRef(() => AppSettingPanelComponent) }],
    host: {
        class: 'app-setting-panel plait-board-attached'
    },
    standalone: true,
    imports: [NgClass, NgIf, FormsModule, AppColorPickerComponent]
})
export class AppSettingPanelComponent extends PlaitIslandBaseComponent implements OnBoardChange {
    currentFillColor: string | undefined = '';

    currentStrokeColor: string | undefined = '';

    currentBranchColor: string | undefined = '';

    currentMarks: Omit<CustomText, 'text'> = {};

    PlaitPointerType = PlaitPointerType;

    MindPointerType = MindPointerType;

    markTypes = MarkTypes;

    isSelectedMind = false;

    isSelectedLine = false;

    fillColor = ['#333333', '#e48483', '#69b1e4', '#e681d4', '#a287e1', ''];

    textColorOptions = ['#333333', '#e03130', '#2f9e44', '#1871c2', '#f08c02', '#c18976'];

    strokeColor = ['#1e1e1e', '#e03130', '#2f9e44', '#1871c2', '#f08c02', '#c18976'];

    branchColor = ['#A287E0', '#6E80DB', '#E0B75E', '#B1C675', '#77C386', '#E48484'];

    align = Alignment.center;

    lineShape = LineShape.straight;

    lineTargetMarker = LineMarkerType.openTriangle;

    lineSourceMarker = LineMarkerType.openTriangle;

    strokeWidth = 3;

    angle = 0;

    setAngleDisabled = false;

    @HostBinding('class.visible')
    get isVisible() {
        const selectedCount = getSelectedElements(this.board).length;
        if (selectedCount > 0) {
            return true;
        } else {
            return false;
        }
    }

    constructor(protected cdr: ChangeDetectorRef) {
        super(cdr);
    }

    onBoardChange() {
        const selectedMindElements = getSelectedMindElements(this.board);
        const selectedLineElements = getSelectedLineElements(this.board);
        this.isSelectedMind = !!selectedMindElements.length;
        this.isSelectedLine = !!selectedLineElements.length;
        if (selectedMindElements.length) {
            const firstMindElement = selectedMindElements[0];
            this.currentFillColor = firstMindElement.fill || '';
            this.currentStrokeColor = firstMindElement.strokeColor || '';
            this.currentBranchColor = firstMindElement.branchColor || '';
            this.strokeWidth = firstMindElement.strokeWidth || 3;
            if (MindElement.hasMounted(firstMindElement)) {
                this.currentMarks = PlaitMarkEditor.getMarks(getFirstTextEditor(firstMindElement));
                this.align = firstMindElement.data.topic.align || Alignment.left;
            }
        }

        const selectedGeometryElements = getSelectedGeometryElements(this.board);
        if (selectedGeometryElements.length) {
            const firstGeometry = selectedGeometryElements[0];
            this.align = firstGeometry.text.align || Alignment.center;
            this.strokeWidth = firstGeometry.strokeWidth || 3;
        }

        const selectedImageElements = getSelectedImageElements(this.board);
        const selectedElements = [...selectedImageElements, ...selectedGeometryElements];
        const selectionAngle = getSelectionAngle(selectedElements);
        this.angle = Math.round(radiansToDegrees(selectionAngle));
        if (hasSameAngle(selectedElements)) {
            this.setAngleDisabled = false;
        } else {
            this.setAngleDisabled = true;
        }

        if (selectedLineElements.length) {
            const firstLine = selectedLineElements[0];
            this.lineShape = firstLine.shape;
            this.lineTargetMarker = firstLine.target.marker;
            this.lineSourceMarker = firstLine.source.marker;
            this.strokeWidth = firstLine.strokeWidth || 3;
        }
    }

    layoutChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value as MindLayoutType;
        MindTransforms.setLayout(this.board, value);
    }

    switchGeometryShape(event: Event, key: string) {
        let shape = (event.target as HTMLSelectElement).value as GeometryShapes;
        DrawTransforms.switchGeometryShape(this.board, shape);
    }

    propertyChange(event: Event, key: string) {
        let value = (event.target as HTMLSelectElement).value as any;
        if (key === 'branchWidth' || key === 'strokeWidth') {
            value = parseInt(value, 10);
        }
        const selectedElement = getSelectedElements(this.board)[0];
        if (selectedElement) {
            const path = PlaitBoard.findPath(this.board, selectedElement);
            Transforms.setNode(this.board, { [key]: value }, path);
        }
    }

    setLineShape(event: Event) {
        let value = (event.target as HTMLSelectElement).value as LineShape;
        DrawTransforms.setLineShape(this.board, { shape: value });
    }

    changeStrokeStyle(event: Event) {
        let value = (event.target as HTMLSelectElement).value;
        PropertyTransforms.setStrokeStyle(this.board, value, { getMemorizeKey });
    }

    changeFill(property: string) {
        PropertyTransforms.setFillColor(this.board, property, { getMemorizeKey });
    }

    changeStroke(property: string) {
        PropertyTransforms.setStrokeColor(this.board, property, { getMemorizeKey });
    }

    changeStrokeWidth(event: Event) {
        let value = parseInt((event.target as HTMLSelectElement).value, 10);
        PropertyTransforms.setStrokeWidth(this.board, value, { getMemorizeKey });
    }

    colorChange(property: string | number | null, attribute: string) {
        const selectedElements = getSelectedElements(this.board);

        if (selectedElements.length) {
            selectedElements.forEach(element => {
                const path = PlaitBoard.findPath(this.board, element);
                Transforms.setNode(this.board, { [attribute]: property }, path);
            });
        }
    }

    changeLineMarker(event: Event, key: string) {
        let value = (event.target as HTMLSelectElement).value as any;
        DrawTransforms.setLineMark(this.board, key as LineHandleKey, value as LineMarkerType);
    }

    changeAngle() {
        const selectedElements = getSelectedElements(this.board);
        const originAngle = getSelectionAngle(selectedElements);
        rotateElements(this.board, selectedElements, degreesToRadians(this.angle) - originAngle);
    }

    textColorChange(value: string) {
        const selectedElements = getSelectedElements(this.board);
        if (selectedElements.length) {
            selectedElements.forEach(element => {
                const editors = getTextEditors(element);
                editors.forEach(editor => PlaitMarkEditor.setColorMark(editor, value));
            });
        }
    }

    setAbstract(event: Event) {
        const selectedElements = getSelectedElements(this.board) as MindElement[];

        const ableSetAbstract = selectedElements.every(element => {
            return canSetAbstract(element);
        });

        if (ableSetAbstract) {
            MindTransforms.insertAbstract(this.board, selectedElements);
        }
    }

    setTextMark(event: MouseEvent, attribute: string) {
        event.preventDefault();
        event.stopPropagation();
        const selectedElements = getSelectedElements(this.board) as MindElement[];
        if (selectedElements.length) {
            selectedElements.forEach(element => {
                const editors = getTextEditors(element);
                editors.forEach(editor => PlaitMarkEditor.toggleMark(editor, attribute as MarkTypes));
            });
        }
    }

    setLink(event: MouseEvent) {
        const selectedElements = getSelectedElements(this.board) as MindElement[];
        if (selectedElements.length) {
            const editor = getFirstTextEditor(selectedElements[0]);

            if (!editor.selection) {
                SlateTransforms.select(editor, [0]);
            }

            if (LinkEditor.isLinkActive(editor)) {
                LinkEditor.unwrapLink(editor);
                return;
            }

            const fragment = Node.fragment(editor, editor.selection!)[0];
            const selectNode = Node.get(fragment, []);
            const selectText = Node.string(selectNode);

            let name = selectText;
            if (!name) {
                name = window.prompt('输入链接文本名称') || '链接';
            }

            const link = window.prompt('输入链接');
            if (link) {
                LinkEditor.wrapLink(editor, name!, link!);
            }
        }
    }

    setFontSize(event: Event) {
        const fontSize = (event.target as HTMLSelectElement).value as FontSizes;
        TextTransforms.setFontSize(this.board, fontSize, (element: PlaitElement) => {
            return MindElement.isMindElement(this.board, element) ? getDefaultMindElementFontSize(this.board, element) : undefined;
        });
    }

    setTextAlign(event: Alignment) {
        const selectedElements = getSelectedElements(this.board) as MindElement[];
        selectedElements.forEach(element => {
            const editors = getTextEditors(element);
            editors.forEach(editor => AlignEditor.setAlign(editor, event));
        });
    }

    setAlign(event: Event) {
        const value = (event.target as HTMLSelectElement).value as any;
        AlignTransform[value as keyof AlignTransform](this.board);
    }
}
