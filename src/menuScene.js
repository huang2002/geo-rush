import { FRAME_DURATION, SIMPLE_BUTTON_WIDTH, engine, SimpleButton, MAX_FRAME_COUNT, createRandomizer } from './common.js';
import { createBomb, recycleBomb } from './bomb.js';
import { createParticleGroup } from './particles.js';
import { mainScene } from './mainScene.js';

const SPAWN_WAITING_TIME = 500;

const BOMB_BOUNDARY_EXTEND = 10;
const BOMB_SPAWN_MIN_GAP = 500;
const BOMB_SPAWN_MAX_GAP = 1500;
const BOMB_SPAWN_MIN_Y = engine.height * 0.6;
const BOMB_SPAWN_MAX_Y = engine.height * 0.8;
const BOMB_SPAWN_MIN_ANGLE = HUtils.deg2rad(10);
const BOMB_SPAWN_MAX_ANGLE = HUtils.deg2rad(70);
const BOMB_MAX_COUNT = 5;

const PARTICLE_GROUP_SPAWN_MIN_GAP = 500;
const PARTICLE_GROUP_SPAWN_MAX_GAP = 2000;
const PARTICLE_GROUP_SPAWN_MIN_X = engine.width * 0.2;
const PARTICLE_GROUP_SPAWN_MAX_X = engine.width * 0.8;
const PARTICLE_GROUP_SPAWN_MIN_Y = engine.height * 0.2;
const PARTICLE_GROUP_SPAWN_MAX_Y = engine.height * 0.8;
const PARTICLE_GROUP_MAX_COUNT = 3;

const bombYRandomizer = createRandomizer();
const bombSideRandomizer = createRandomizer();
const bombAngleRandomizer = createRandomizer();
const bombTimeoutRandomizer = createRandomizer();
const particleXRandomizer = createRandomizer();
const particleYRandomizer = createRandomizer();
const particleTimeoutRandomizer = createRandomizer();

const HELP_MESSAGE = '\
Your goal is to move your character as far as possible. \
To do so, click anywhere to emit bombs, \
which explode on hitting platforms and push the character.\
';

/**
 * @type {null | number}
 */
let bombSpawnTimer = null;
/**
 * @type {(import('./bomb').Bomb)[]}
 */
let bombs = [];

const spawnBomb = () => {

    if (bombs.length >= BOMB_MAX_COUNT) {
        bombSpawnTimer = setTimeout(spawnBomb, SPAWN_WAITING_TIME);
        return;
    }

    const y = bombYRandomizer.integer(
        BOMB_SPAWN_MIN_Y,
        BOMB_SPAWN_MAX_Y,
    );
    const angle = bombAngleRandomizer.float(
        BOMB_SPAWN_MIN_ANGLE,
        BOMB_SPAWN_MAX_ANGLE,
    );
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    /**
     * @type {import('./bomb').Bomb}
     */
    let bomb;

    if (bombSideRandomizer.boolean()) {
        const x = -BOMB_BOUNDARY_EXTEND;
        bomb = createBomb(x, y, dx, -dy);
    } else {
        const x = menuScene.bounds.width + BOMB_BOUNDARY_EXTEND;
        bomb = createBomb(x, y, -dx, -dy);
    }

    menuSceneWorld.appendChild(bomb);
    bombs.push(bomb);

    const nextTimeout = bombTimeoutRandomizer.integer(
        BOMB_SPAWN_MIN_GAP,
        BOMB_SPAWN_MAX_GAP,
    );
    bombSpawnTimer = setTimeout(spawnBomb, nextTimeout);

};

/**
 * @type {null | number}
 */
let particleGroupSpawnTimer = null;
/**
 * @type {(import('./particles').ParticleGroup)[]}
 */
let particleGroups = [];

const spawnParticleGroup = () => {

    if (particleGroups.length >= PARTICLE_GROUP_MAX_COUNT) {
        particleGroupSpawnTimer = setTimeout(
            spawnParticleGroup,
            SPAWN_WAITING_TIME,
        );
        return;
    }

    const x = particleXRandomizer.integer(
        PARTICLE_GROUP_SPAWN_MIN_X,
        PARTICLE_GROUP_SPAWN_MAX_X,
    );
    const y = particleYRandomizer.integer(
        PARTICLE_GROUP_SPAWN_MIN_Y,
        PARTICLE_GROUP_SPAWN_MAX_Y,
    );

    const particleGroup = createParticleGroup(x, y, COM.Schedule.getTimeStamp());

    particleGroup.particles.forEach(particle => {
        menuSceneWorld.appendChild(particle);
    });
    particleGroups.push(particleGroup);

    particleGroup.animation.on('finish', event => {
        const index = particleGroups.indexOf(particleGroup);
        HUtils.removeElements(particleGroups, index, 1);
    });

    const nextTimeout = particleTimeoutRandomizer.integer(
        PARTICLE_GROUP_SPAWN_MIN_GAP,
        PARTICLE_GROUP_SPAWN_MAX_GAP,
    );
    particleGroupSpawnTimer = setTimeout(spawnParticleGroup, nextTimeout);

};

/**
 * @type {POM.WorldNode<any>}
 */
const menuSceneWorld = new POM.WorldNode({
    id: 'menu-scene-world',
    stretch: 1,
    root: engine,
    frameDuration: FRAME_DURATION,
    maxFrameCount: MAX_FRAME_COUNT,
    listeners: {
        afterUpdate() {
            const bombBottomY = menuScene.bounds.height + BOMB_BOUNDARY_EXTEND;
            bombs = bombs.filter((bomb, i) => {
                if (bomb.offsetY < bombBottomY) {
                    return true;
                } else {
                    menuSceneWorld.removeChild(bomb);
                    recycleBomb(bomb);
                    return false;
                }
            });
            // particles automatically remove themselves when animations finish
        },
    },
});

export const menuScene = COM.create(HE.SceneNode, {
    id: 'menu-scene',
    interactive: true,
    listeners: {
        enter() {
            bombSpawnTimer = setTimeout(spawnBomb, BOMB_SPAWN_MIN_GAP);
            particleGroupSpawnTimer = setTimeout(
                spawnParticleGroup,
                PARTICLE_GROUP_SPAWN_MIN_GAP,
            );
            menuSceneWorld.activate();
        },
        exit(event) {

            menuSceneWorld.childNodes.forEach(childNode => {
                menuSceneWorld.removeChild(childNode);
            });
            menuSceneWorld.deactivate();

            bombs.forEach(bomb => {
                recycleBomb(bomb);
            });
            bombs.length = 0;
            if (bombSpawnTimer !== null) {
                clearTimeout(bombSpawnTimer);
                bombSpawnTimer = null;
            }

            particleGroups.forEach(particleGroup => {
                particleGroup.animation.finish(event.timeStamp);
            });
            // particleGroups remove themselves when animations finish
            if (particleGroupSpawnTimer !== null) {
                clearTimeout(particleGroupSpawnTimer);
                particleGroupSpawnTimer = null;
            }

        },
    },
}, [

    menuSceneWorld,

    COM.create(COM.AlignNode, {
        stretchX: 1,
        offsetY: 80,
        alignX: 'center',
    }, [
        COM.create(COM.FlowNode, {
            boundsWidth: SIMPLE_BUTTON_WIDTH,
            direction: 'y',
            gap: 20,
        }, [

            COM.create(COM.TextNode, {
                stretchX: 1,
                boundsHeight: 150,
                content: 'Geo Rush',
                style: {
                    fillStyle: '#0F0',
                    font: 'bold 40px sans-serif',
                    textAlign: 'center',
                    textBaseline: 'middle',
                },
            }),

            SimpleButton('Start', () => {
                engine.enter(mainScene);
            }),

            SimpleButton('Help', () => {
                alert(HELP_MESSAGE);
            }),

        ]),
    ]),

]);
