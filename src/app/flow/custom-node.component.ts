import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaitPluginElementContext, Point, drawCircle, PlaitBoard } from '@plait/core';
import { FlowNode, FlowNodeComponent } from '@plait/flow';

@Component({
    selector: 'custom-flow-node',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomFlowNodeComponent extends FlowNodeComponent {
    onContextChanged(value: PlaitPluginElementContext<FlowNode, PlaitBoard>, previous: PlaitPluginElementContext<FlowNode, PlaitBoard>) {
        if (value.element !== previous.element && this.initialized) {
            this.updateElement(value.element);
        }
    }

    updateElement(element: FlowNode = this.element) {
        this.drawElement(element);
        this.drawRichtext(element);
    }

    drawElement(element: FlowNode = this.element) {
        this.destroyElement();
        const drawCirclePoint = [element.points![0][0] + element.width / 2, element.points![0][1] + element.height / 2] as Point;
        this.nodeG = drawCircle(this.roughSVG, drawCirclePoint, element.height, {
            fillStyle: 'solid',
            fill: 'rgb(61, 75, 102)'
        });
        this.g.append(this.nodeG);
        this.render2.addClass(this.g, 'flow-custom-node');
    }
}
