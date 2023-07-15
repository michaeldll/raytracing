import Criador from "..";

export default abstract class Mesh {
    public renderer: Criador;
    protected shaderModule: GPUShaderModule;
    public pipeline: GPURenderPipeline; // Accessed
    public vertexBuffer: GPUBuffer; // Accessed in passEncoder.setVertexBuffer

    constructor(renderer: Criador, shader:string) {
        this.renderer = renderer;
    }

    protected abstract initShaderModules(shader:string): void;
    protected abstract initVertexBuffer(): void;
    protected abstract initPipeline(): void;
    protected initUniforms?(): void
    protected initTexture?(): void
    public render?(): void
}