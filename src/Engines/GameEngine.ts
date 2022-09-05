import GameObject from 'ObjectLibrary/GameObject';
import ThreeEngine from './ThreeEngine';
import SceneManager, { GameObjectType } from 'Managers/SceneManager';

export interface GameKeyState {
	ArrowUp: boolean;
	ArrowDown: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
	Space: boolean;
}

export default class GameEngine {
	// Three JS related
	threeEngine: ThreeEngine;
	maxVisibleDistance = 0;

	// Controls
	keyState: GameKeyState = {
		ArrowUp: false,
		ArrowDown: false,
		ArrowLeft: false,
		ArrowRight: false,
		Space: false,
	};

	// Other engines
	sceneManager: SceneManager;

	constructor(threeEngine: ThreeEngine) {
		this.threeEngine = threeEngine;
		this.sceneManager = new SceneManager(this.threeEngine);
		this.recalculateVisibleDistance();
	}

	setMaxVisibleDistance = (distance: number) => {
		this.maxVisibleDistance = distance;
		this.sceneManager.setMaxVisibleDistance(distance);
	};

	recalculateVisibleDistance = () => {
		const { height, width } = this.threeEngine.getVisibleHeightAndWidth();
		this.setMaxVisibleDistance(Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2)) / 2);
	};

	initialise = () => {
		console.log('GameEngine initialised');

		this.recalculateVisibleDistance();

		this.threeEngine.setOnAnimate(this.onAnimate);

		this.sceneManager.initialise();
	};

	dispose = () => {
		console.log('GameEngine disposed');
		this.sceneManager.dispose();
		this.threeEngine.setOnAnimate(undefined);
	};

	onAnimate = (frame: number) => {
		// Add queued objects to scene
		this.sceneManager.addObjectsToScene();

		// Animate spaceship first
		const spaceship = this.sceneManager.getSpaceship();
		spaceship.beforeAnimate(frame, this.keyState);

		// Handle all bullets
		this.sceneManager.getAllBullets().forEach((bullet) => {
			// check asteroids for collision
			if (frame % 2 === 0) {
				for (const asteroid of this.sceneManager.gameObjects[GameObjectType.Asteroid]) {
					const distance = this.threeEngine.calculateDistanceBetweenObjects(
						bullet._object3d,
						asteroid._object3d,
					);
					if (asteroid.checkForBulletCollision(bullet, distance)) {
						break;
					}
				}
				// update spaceship proximity
				this.calculateSpaceshipProximity(bullet);
			}
		});

		// Handle spaceship bullets
		this.sceneManager.gameObjects[GameObjectType.SpaceshipBullet].forEach((bullet) => {
			// check enemies for collision
			if (frame % 2 === 0 && !bullet.getShouldRemove()) {
				for (const enemy of this.sceneManager.gameObjects[GameObjectType.Enemy]) {
					const distance = this.threeEngine.calculateDistanceBetweenObjects(
						bullet._object3d,
						enemy._object3d,
					);
					if (enemy.checkForBulletCollision(bullet, distance)) {
						break;
					}
				}
			}
			if (!bullet.getShouldRemove()) {
				bullet.beforeAnimate(frame);
			}
		});

		// Handle enemy bullets
		this.sceneManager.gameObjects[GameObjectType.EnemyBullet].forEach((bullet) => {
			// check spaceship for collision
			if (frame % 2 === 0 && !bullet.getShouldRemove()) {
				spaceship.checkCollisionWithBullet(bullet);
			}
			if (!bullet.getShouldRemove()) {
				bullet.beforeAnimate(frame);
			}
		});

		// Handle any fading artifacts that don't affect the game (particles, explosions, etc)
		this.sceneManager.gameObjects[GameObjectType.FadingArtifact].forEach((artifact) => {
			if (!artifact.getShouldRemove()) {
				artifact.beforeAnimate(frame);
			}
		});

		// Handle asteroids
		this.sceneManager.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
			if ((frame + 1) % 3 === 0) {
				// update spaceship proximity
				this.calculateSpaceshipProximity(asteroid);
				if (!spaceship.isInvincible) {
					asteroid.checkForSpaceshipCollision(spaceship);
				}
			}
			if (!asteroid.getShouldRemove()) {
				asteroid.beforeAnimate(frame);
			}
		});

		// Handle enemies
		this.sceneManager.gameObjects[GameObjectType.Enemy].forEach((enemy) => {
			if ((frame + 2) % 3 === 0) {
				// update spaceship proximity
				this.calculateSpaceshipProximity(enemy);
				if (!spaceship.isInvincible) {
					enemy.checkForSpaceshipCollision(spaceship);
				}
			}
			if (!enemy.getShouldRemove()) {
				enemy.beforeAnimate(frame);
			}
		});

		// Remove any objects that need to be removed
		this.sceneManager.removeObjectsFromScene();

		// Automatically add objects to fulfill the target if required
		this.sceneManager.fulfillGameObjectTargets();

		// Animate all the objects in the scene
		this.sceneManager.animate();

		// align camera with spaceship
		this.threeEngine.setCameraPosition(spaceship._object3d.position.x, spaceship._object3d.position.y);
	};

	calculateSpaceshipProximity = (object: GameObject) => {
		const spaceship = this.sceneManager.getSpaceship();
		const distance = this.threeEngine.calculateDistanceBetweenObjects(object._object3d, spaceship._object3d);
		const angle = this.threeEngine.calculateAngleBetweenObjects(object._object3d, spaceship._object3d);
		object.setAngleToSpaceship(angle);
		object.setDistanceToSpaceship(distance);
	};

	onKeyDown = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'ArrowUp':
				this.keyState['ArrowUp'] = true;
				// move spaceship forward
				break;
			case 'ArrowDown':
				this.keyState['ArrowDown'] = true;
				// move spaceship backward
				break;
			case 'ArrowLeft':
				this.keyState['ArrowLeft'] = true;
				// rotate spaceship left
				break;
			case 'ArrowRight':
				this.keyState['ArrowRight'] = true;
				// rotate spaceship right
				break;
			case 'Space':
				this.keyState['Space'] = true;
				this.sceneManager.getSpaceship().fireBullet();
				// fire
				break;
		}
	};

	onKeyUp = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'ArrowUp':
				this.keyState['ArrowUp'] = false;
				// stop moving spaceship forward
				break;
			case 'ArrowDown':
				this.keyState['ArrowDown'] = false;
				// stop moving spaceship backward
				break;
			case 'ArrowLeft':
				this.keyState['ArrowLeft'] = false;
				// stop rotating spaceship left
				break;
			case 'ArrowRight':
				this.keyState['ArrowRight'] = false;
				// stop rotating spaceship right
				break;
			case 'Space':
				this.keyState['Space'] = false;
				this.sceneManager.getSpaceship().bulletAvailable = true;
				// stop firing
				break;
		}
	};
}
