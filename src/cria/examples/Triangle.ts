import Criador from "..";
import Mesh from "../abstract/Mesh";

export default class Triangle extends Mesh {
    constructor(renderer: Criador) {
        super(renderer);

        this.initShaderModules()
        this.initVertexBuffer()
        this.initPipeline()
    }

    initShaderModules = (): void => {
        this.shaderModule = this.renderer.device.createShaderModule({
            label: 'Triangle Shader Module',
            code: /* wgsl */`
              // Every vertex attribute input is identified by a @location, which
              // matches up with the shaderLocation specified during pipeline creation.
              struct VertexIn {
                @location(0) pos: vec3f,
                @location(1) color: vec4f,
              }
        
              struct VertexOut {
                // Every vertex shader must output a value with @builtin(position)
                @builtin(position) pos: vec4f,
        
                // Other outputs are given a @location so that they can map to the
                // fragment shader inputs.
                @location(0) color: vec4f,
              }
        
              // Shader entry points can be named whatever you want, and you can have
              // as many as you want in a single shader module.
              @vertex
              fn vertexMain(in: VertexIn) -> VertexOut {
                var out: VertexOut;
                out.pos = vec4f(in.pos, 1);
                out.color = in.color;
                return out;
              }
        
              // Every fragment shader has to output one vector per pipeline target.
              // The @location corresponds to the target index in the array.
              @fragment
              fn fragmentMain(@location(0) color: vec4f) -> @location(0) vec4f {
                return color;
              }`
        });
    }

    initVertexBuffer(): void {
        // It's easiest to specify vertex data with TypedArrays, like a Float32Array
        // You are responsible for making sure the layout of the data matches the
        // layout that you describe in the pipeline `buffers`.
        const vertexData = new Float32Array([
            // X,  Y, Z   R, G, B, A,
            0, 1, 1, 1, 0, 0, 1,
            -1, -1, 1, 0, 1, 0, 1,
            1, -1, 1, 0, 0, 1, 1,
        ]);
        this.vertexBuffer = this.renderer.device.createBuffer({
            // Buffers are given a size in bytes at creation that can't be changed.
            size: vertexData.byteLength,
            // Usage defines what this buffer can be used for
            // VERTEX = Can be passed to setVertexBuffer()
            // COPY_DST = You can write or copy data into it after creation
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        // writeBuffer is the easiest way to TypedArray data into a buffer.
        this.renderer.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    }

    initPipeline(): void {
        // Pipelines bundle most of the render state (like primitive types, blend
        // modes, etc) and shader entry points into one big object.
        this.pipeline = this.renderer.device.createRenderPipeline({
            label: 'Triangle Render Pipeline',
            // All pipelines need a layout, but if you don't need to share data between
            // pipelines you can use the 'auto' layout to have it generate one for you!
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: 'vertexMain',
                // `buffers` describes the layout of the attributes in the vertex buffers.
                buffers: [{
                    arrayStride: 28, // Bytes per vertex (3 floats + 4 floats)
                    attributes: [{
                        shaderLocation: 0, // VertexIn.pos in the shader
                        offset: 0, // Starts at the beginning of the buffer
                        format: 'float32x3' // Data is 3 floats
                    }, {
                        shaderLocation: 1, // VertexIn.color in the shader
                        offset: 12, // Starts 12 bytes (3 floats) in to the buffer
                        format: 'float32x4' // Data is 4 floats
                    }]
                }],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: 'fragmentMain',
                // `targets` indicates the format of each render target this pipeline
                // outputs to. It must match the colorAttachments of any renderPass it's
                // used with.
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                }],
            },
        });
    }
}