import Criador from "../renderer";

export default abstract class Mesh {
    public renderer: Criador;
    protected shaderModule: GPUShaderModule;
    protected pipeline: GPURenderPipeline;

    constructor(renderer: Criador, shader:string) {
        this.renderer = renderer;
    }

    protected abstract initShaderModules(shader:string): void;
    protected abstract initAttributeBuffers(): void;
    protected abstract initPipeline(): void;
    protected initUniforms?(): void
    protected initTexture?(): void
    public render?(): void
}