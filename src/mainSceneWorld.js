import { engine, createRandomizer, COMMON_ELASTICITY, FRAME_DURATION, COMMON_FRICTION, COMMON_GRAVITY, COMMON_STATIC_FRICTION, MAX_FRAME_COUNT } from './common.js';

export const CHARACTER_SIZE = 40;
export const CHARACTER_INIT_X = engine.width / 2;

const PLATFORM_COUNT = 5;
export const PLATFORM_MIN_Y = engine.height * 0.45;
const PLATFORM_MAX_Y = engine.height * 0.60;
const PLATFORM_MIN_WIDTH = 60;
const PLATFORM_MAX_WIDTH = 120;
const PLATFORM_MIN_HEIGHT = 80;
const PLATFORM_MAX_HEIGHT = 120;
const PLATFORM_MIN_GAP = 5;
const PLATFORM_MAX_GAP = 60;
const PLATFORM_COLORS = [
    '#F00',
    '#FF0',
    '#0F0',
    '#0FF',
    '#00F',
    '#F0F',
];

const platformYRandomizer = createRandomizer();
const platformWidthRandomizer = createRandomizer();
const platformHeightRandomizer = createRandomizer();
const platformColorRandomizer = createRandomizer();
const platformGapRandomizer = createRandomizer();

export const character = new POM.BodyNode({
    category: 'character',
    classNames: ['character'],
    gravity: COMMON_GRAVITY,
    friction: COMMON_FRICTION,
    staticFriction: COMMON_STATIC_FRICTION,
    elasticity: COMMON_ELASTICITY,
    vertices: COM.Vertices.createRectangle(
        CHARACTER_SIZE,
        CHARACTER_SIZE,
    ),
    style: {
        fillStyle: '#39F',
        lineWidth: 2,
    },
});

export const platformPool = new HP.Pool({
    initSize: PLATFORM_COUNT,
    create: () => (
        new POM.BodyNode({
            category: 'platform',
            classNames: ['platform'],
            active: false,
            friction: COMMON_FRICTION,
            staticFriction: COMMON_STATIC_FRICTION,
            elasticity: COMMON_ELASTICITY,
            style: {
                fillStyle: '#113',
                lineWidth: 2,
            },
        })
    ),
    init(platform) {
        const width = platformWidthRandomizer.integer(
            PLATFORM_MIN_WIDTH,
            PLATFORM_MAX_WIDTH,
        );
        const height = platformHeightRandomizer.integer(
            PLATFORM_MIN_HEIGHT,
            PLATFORM_MAX_HEIGHT,
        );
        platform.updateVertices(
            COM.Vertices.fromArray([
                0, 0,
                0, height,
                width, height,
                width, 0,
            ]),
        );
        platform.offset.y = platformYRandomizer.integer(
            PLATFORM_MIN_Y,
            PLATFORM_MAX_Y,
        );
        platform.style.strokeStyle = platformColorRandomizer.choice(
            PLATFORM_COLORS,
        );
    },
});

/**
 * @typedef {ReturnType<platformPool['create']>} Platform
 */

/**
 * @type {(import('./bomb').Bomb)[]}
 */
export let bombs = [];

/**
 * @type {Set<import('./particles').ParticleGroup>}
 */
export const particleGroups = new Set();

/**
 * @type {Platform[]}
 */
export let platforms = [];

export const updatePlatforms = () => {

    platforms = platforms.filter(platform => {
        if (platform.bounds.right >= 0) {
            return true;
        } else {
            mainSceneWorld.removeChild(platform);
            platformPool.push(platform);
            return false;
        }
    });

    for (let i = platforms.length; i < PLATFORM_COUNT; i++) {
        const gap = platformGapRandomizer.integer(
            PLATFORM_MIN_GAP,
            PLATFORM_MAX_GAP,
        );
        const nextPlatform = platformPool.pop();
        const lastPlatform = platforms[platforms.length - 1];
        if (lastPlatform) {
            nextPlatform.offset.x = lastPlatform.offset.x
                + lastPlatform.bounds.width + gap;
        } else {
            nextPlatform.offset.x = character.offset.x
                - (nextPlatform.bounds.width - character.bounds.width) / 2;
        }
        platforms.push(nextPlatform);
        mainSceneWorld.appendChild(nextPlatform);
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
            updatePlatforms();
            updateCamera();
        },

        afterUpdate() {
            bombs = bombs.filter(bomb => {
                if (bomb.bounds.top <= engine.height) {
                    return true;
                } else {
                    mainSceneWorld.removeChild(bomb);
                    return false;
                }
            });
        },

    },
});

export const updateCamera = () => {
    mainSceneWorld.offset.x = engine.width / 2 - character.offset.x
        - character.bounds.width / 2;
};
