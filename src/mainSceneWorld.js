import { recycleBomb } from './bomb.js';
import { character } from './character.js';
import { engine, FRAME_DURATION, MAX_FRAME_COUNT } from './common.js';
import { updatePlatforms } from './platform.js';

const CAMERA_SPEED = 0.5;

/**
 * @type {(import('./bomb').Bomb)[]}
 */
export let bombs = [];

/**
 * @type {Set<import('./particles').ParticleGroup>}
 */
export const particleGroups = new Set();

export const updateCamera = (instant = false) => {
    const targetOffsetX = engine.width / 2 - character.bounds.width / 2
        - character.offset.x - character.velocity.x;
    if (instant) {
        mainSceneWorld.offset.x = targetOffsetX;
    } else {
        mainSceneWorld.offset.x = HUtils.interpolate(
            mainSceneWorld.offset.x,
            targetOffsetX,
            CAMERA_SPEED,
        );
    }
};

/**
 * @type {POM.WorldNode<any>}
 */
export const mainSceneWorld = new POM.WorldNode({
    id: 'main-scene-world',
    stretch: 1,
    root: engine,
    frameDuration: FRAME_DURATION,
    maxFrameCount: MAX_FRAME_COUNT,
    listeners: {

        beforeUpdate() {

            updatePlatforms(mainSceneWorld);

            bombs = bombs.filter(bomb => {
                if (bomb.bounds.top <= engine.height) {
                    return true;
                } else {
                    recycleBomb(bomb);
                    return false;
                }
            });

            updateCamera();

        },

    },
});
