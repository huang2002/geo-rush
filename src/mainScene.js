import { createBomb, recycleBomb } from './bomb.js';
import { COMMON_ELASTICITY, FRAME_DURATION, COMMON_FRICTION, COMMON_GRAVITY, COMMON_STATIC_FRICTION, engine, MAX_FRAME_COUNT, createRandomizer, SimpleButton, SIMPLE_BUTTON_WIDTH } from './common.js';
import { menuScene } from './menuScene.js';
import { createParticleGroup } from './particles.js';

const SCORE_SCALE = 0.05;

const CHARACTER_SIZE = 40;
const CHARACTER_INIT_X = engine.width / 2;
const BOMB_SPAWN_MIN_GAP = 200;
const BOMB_IMPACT_COEFFICIENT = 9;

const PLATFORM_COUNT = 5;
const PLATFORM_MIN_Y = engine.height * 0.45;
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

let currentScore = 0;

const character = new POM.BodyNode({
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

const platformPool = new HP.Pool({
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
let bombs = [];

/**
 * @type {Set<import('./particles').ParticleGroup>}
 */
const particleGroups = new Set();

/**
 * @type {Platform[]}
 */
let platforms = [];

const updatePlatforms = () => {

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

const handleClick = HUtils.throttle(
    BOMB_SPAWN_MIN_GAP,
    /**
     * @param {number} x
     * @param {number} y
     */
    (x, y) => {

        const { offset: characterOffset, bounds: characterBounds,
            velocity: characterVelocity } = character;
        const halfCharacterWidth = characterBounds.width / 2;
        const halfCharacterHeight = characterBounds.height / 2;

        const bomb = createBomb(
            characterOffset.x + halfCharacterWidth,
            characterOffset.y + halfCharacterHeight,
            x - engine.width / 2 + characterVelocity.x,
            y - characterOffset.y - halfCharacterHeight + characterVelocity.y,
        );

        const { offset: bombOffset, bounds: bombBounds } = bomb;
        const halfBombWidth = bombBounds.width / 2;
        const halfBombHeight = bombBounds.height / 2;

        bombOffset.sub(halfBombWidth, halfBombHeight);

        bomb.on('collision', event => {

            const bombIndex = bombs.indexOf(bomb);
            if (bombIndex === -1) {
                return;
            }
            HUtils.removeElements(
                bombs,
                bombIndex,
                1,
            );

            mainSceneWorld.removeChild(bomb);

            const particleGroup = createParticleGroup(
                bombOffset.x + halfBombWidth,
                bombOffset.y + halfBombHeight,
                event.timeStamp,
            );
            particleGroup.animation.on('finish', () => {
                particleGroups.delete(particleGroup);
                // particles remove themselves automatically
            });
            particleGroup.particles.forEach(particle => {
                mainSceneWorld.appendChild(particle);
            });
            particleGroups.add(particleGroup);

            const dx = characterOffset.x + halfCharacterWidth
                - bombOffset.x - halfBombWidth;
            const dy = characterOffset.y + halfCharacterHeight
                - bombOffset.y - halfBombHeight;
            const d = HUtils.quadraticSum(dx, dy) ** 0.25;
            const impact = new COM.Vector(dx, dy);
            impact.normalize();
            impact.scale(BOMB_IMPACT_COEFFICIENT / d);
            character.velocity.addVector(impact);

        });

        bombs.push(bomb);
        mainSceneWorld.insertBefore(character, bomb);

    }
);

/**
 * @type {POM.WorldNode<any>}
 */
const mainSceneWorld = new POM.WorldNode({
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

            currentScore = Math.max(
                currentScore,
                Math.floor((character.offset.x - CHARACTER_INIT_X) * SCORE_SCALE),
            );
            scoreText.content = `Score: ${currentScore}`;

            if (character.bounds.bottom >= engine.height) {
                mainSceneWorld.deactivate();
                gameOverSection.visible = true;
            }

        },

    },
});

const updateCamera = () => {
    mainSceneWorld.offset.x = engine.width / 2 - character.offset.x
        - character.bounds.width / 2;
};

const scoreText = new COM.TextNode({
    id: 'score-text',
    stretchX: 1,
    offsetY: 50,
    style: {
        fillStyle: '#FC0',
        font: 'bold 22px sans-serif',
        textAlign: 'center',
    },
});

const gameOverSection = COM.create(COM.AlignNode, {
    offsetY: 130,
    stretch: 1,
    alignX: 'center',
}, [
    COM.create(COM.FlowNode, {
        direction: 'y',
        boundsWidth: SIMPLE_BUTTON_WIDTH,
    }, [
        COM.create(COM.TextNode, {
            content: 'Game Over',
            stretchX: 1,
            boundsHeight: 80,
            style: {
                fillStyle: '#1CF',
                font: 'bold 30px sans-serif',
                textAlign: 'center',
            },
        }),
        SimpleButton('Back', () => {
            if (mainSceneWorld.active) {
                return;
            }
            engine.enter(menuScene);
        }),
    ]),
]);

export const mainScene = COM.create(HE.SceneNode, {
    id: 'main-scene',
    interactive: true,
    penetrable: false,
    listeners: {

        enter() {

            currentScore = 0;

            character.velocity.set(0, 0);
            character.offset.set(
                CHARACTER_INIT_X,
                PLATFORM_MIN_Y - CHARACTER_SIZE * 3,
            );
            mainSceneWorld.appendChild(character);

            updateCamera();
            updatePlatforms();

            gameOverSection.visible = false;

            mainSceneWorld.activate();

        },

        exit(event) {

            mainSceneWorld.childNodes.slice().forEach(childNode => {
                mainSceneWorld.removeChild(childNode);
            });
            mainSceneWorld.deactivate();

            platforms.forEach(platform => {
                platformPool.push(platform);
            });
            platforms.length = 0;

            bombs.forEach(bomb => {
                recycleBomb(bomb);
            });

            particleGroups.forEach(particleGroup => {
                particleGroup.animation.finish(event.timeStamp);
            });

        },

        click(event) {
            if (!mainSceneWorld.active) {
                return;
            }
            handleClick(
                event.data.x,
                event.data.y,
            );
        },

    },
}, [
    scoreText,
    mainSceneWorld,
    gameOverSection,
]);
