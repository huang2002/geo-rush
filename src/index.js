import { engine } from "./common.js";
import { menuScene } from './menuScene.js';

engine.renderer.canvas.id = 'canvas';
document.body.appendChild(engine.renderer.canvas);

engine.enter(menuScene);

engine.resizer.update(() => {
    engine.updateAndRender();
});
