import Criador from "..";

export default abstract class Mesh{
    renderer: Criador;
    shaderModule: GPUShaderModule;
    pipeline: GPURenderPipeline;
    vertexBuffer: GPUBuffer;

    constructor(renderer: Criador) {
        this.renderer = renderer;
    }

    abstract initShaderModules(): void;

    abstract initVertexBuffer(): void;

    abstract initPipeline(): void;
}