export interface Command {
    type: string;
    [key: string]: any;
}

export interface FrameData {
    frame: number;
    commands: Command[];
}

class CommandBuffer {
    private frames: Map<number, Command[]> = new Map();

    // We only want to execute a tick if the buffer has the frame ready
    public hasFrame(frameNumber: number): boolean {
        return this.frames.has(frameNumber);
    }

    public getCommandsForFrame(frameNumber: number): Command[] {
        const commands = this.frames.get(frameNumber) || [];
        this.frames.delete(frameNumber); // clean up
        return commands;
    }

    public pushFrame(frame: number, commands: Command[]) {
        this.frames.set(frame, commands);
    }

    public reset() {
        this.frames.clear();
    }
}

export const commandBuffer = new CommandBuffer();
