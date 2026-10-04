export const NodeState = {
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    RUNNING: 'RUNNING',
} as const;

export type NodeState = (typeof NodeState)[keyof typeof NodeState];

export interface Blackboard {
    [key: string]: any;
}

export abstract class BehaviorNode {
    protected children: BehaviorNode[] = [];

    constructor(children?: BehaviorNode[]) {
        if (children) {
            this.children = children;
        }
    }

    public abstract evaluate(blackboard: Blackboard): NodeState;
}

export class Sequence extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        for (const child of this.children) {
            const state = child.evaluate(blackboard);

            if (state === NodeState.FAILURE) {
                return NodeState.FAILURE;
            } else if (state === NodeState.RUNNING) {
                return NodeState.RUNNING;
            }
        }

        return NodeState.SUCCESS;
    }
}

export class Parallel extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        let anyChildIsRunning = false;
        let anyChildFailed = false;

        for (const child of this.children) {
            const state = child.evaluate(blackboard);

            if (state === NodeState.FAILURE) {
                anyChildFailed = true;
            } else if (state === NodeState.RUNNING) {
                anyChildIsRunning = true;
            }
        }

        if (anyChildFailed) {
            return NodeState.FAILURE;
        }

        return anyChildIsRunning ? NodeState.RUNNING : NodeState.SUCCESS;
    }
}

export class Selector extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        for (const child of this.children) {
            const state = child.evaluate(blackboard);

            if (state === NodeState.SUCCESS) {
                return NodeState.SUCCESS;
            } else if (state === NodeState.RUNNING) {
                return NodeState.RUNNING;
            }
        }

        return NodeState.FAILURE;
    }
}

export class Inverter extends BehaviorNode {
    constructor(child: BehaviorNode) {
        super([child]);
    }

    public evaluate(blackboard: Blackboard): NodeState {
        if (this.children.length === 0) return NodeState.SUCCESS;

        const state = this.children[0].evaluate(blackboard);
        if (state === NodeState.SUCCESS) {
            return NodeState.FAILURE;
        } else if (state === NodeState.FAILURE) {
            return NodeState.SUCCESS;
        }
        return NodeState.RUNNING;
    }
}
