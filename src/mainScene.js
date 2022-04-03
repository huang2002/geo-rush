import { createBomb, recycleBomb } from './bomb.js';
import { engine, SimpleButton, SIMPLE_BUTTON_WIDTH } from './common.js';
import { bombs, character, CHARACTER_INIT_X, CHARACTER_SIZE, mainSceneWorld, particleGroups, platformPool, platforms, PLATFORM_MIN_Y, updateCamera, updatePlatforms } from './mainSceneWorld.js';
import { menuScene } from './menuScene.js';
import { createParticleGroup } from './particles.js';

const BOMB_SPAWN_MIN_GAP = 200;
const BOMB_IMPACT_COEFFICIENT = 9;

const SCORE_SCALE = 0.05;

let currentScore = 0;

mainSceneWorld.on('afterUpdate', () => {

    currentScore = Math.max(
        currentScore,
        Math.floor((character.offset.x - CHARACTER_INIT_X) * SCORE_SCALE),
    );

    scoreText.content = `Score: ${currentScore}`;

    if (character.bounds.bottom >= engine.height) {
        mainSceneWorld.deactivate();
        gameOverSection.visible = true;
    }

});

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

export const scoreText = new COM.TextNode({
    id: 'score-text',
    stretchX: 1,
    offsetY: 50,
    style: {
        fillStyle: '#FC0',
        font: 'bold 22px sans-serif',
        textAlign: 'center',
    },
});

export const gameOverSection = COM.create(COM.AlignNode, {
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
        }

    },
}, [
    scoreText,
    mainSceneWorld,
    gameOverSection,
]);
