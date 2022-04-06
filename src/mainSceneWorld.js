import { recycleBomb } from './bomb.js';
import { character } from './character.js';
import { updateCoins } from './coin.js';
import { engine, FRAME_DURATION, MAX_FRAME_COUNT } from './common.js';
import { updatePlatforms } from './platform.js';

/**
 * @type {(import('./bomb').Bomb)[]}
 */
export let bombs = [];

/**
 * @type {Set<import('./particles').ParticleGroup>}
 */
export const particleGroups = new Set();

/**
 * @param {number} timeStamp
 */
export const updateCamera = (timeStamp) => {

    mainSceneWorld.offset.x =
        engine.width / 2
        - character.bounds.width / 2
        - character.offset.x;

    mainSceneWorld.locate(timeStamp);

    // `WorldNode.noChildUpdate` is `true` by default,
    // so `childNode.locate`s are invoked manually here.
    mainSceneWorld.childNodes.forEach(childNode => {
        childNode.locate(timeStamp);
    });

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

            updateCoins();
            updatePlatforms(mainSceneWorld);

            bombs = bombs.filter(bomb => {
                if (bomb.bounds.top <= engine.height) {
                    return true;
                } else {
                    recycleBomb(bomb);
                    return false;
                }
            });

        },

        afterUpdate(event) {
            updateCamera(event.timeStamp);
        },

    },
});
