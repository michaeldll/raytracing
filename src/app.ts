import Criador from "./cria";
import "./scss/global.scss";
import { callWhenReady } from "./utils";

type Window = typeof window & {
  IS_PRODUCTION: boolean;
};

const init = () => {  
  const canvas = document.querySelector(".webgpu-canvas") as HTMLCanvasElement;
  new Criador(canvas)
  
  // Enable hot reloading in development
  if (!(window as Window).IS_PRODUCTION) {
    new EventSource('/esbuild').addEventListener('change', () => location.reload())
  };
};

callWhenReady(init);
