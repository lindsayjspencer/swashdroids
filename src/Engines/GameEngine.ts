import Asteroid, { AsteroidSize } from 'ObjectLibrary/Asteroid';
import Bullet from 'ObjectLibrary/Bullet';
import SceneObject from 'ObjectLibrary/SceneObject';
import GameObject from 'ObjectLibrary/GameObject';
import Spaceship from 'ObjectLibrary/Spaceship';
import ThreeEngine from './ThreeEngine';
import Enemy from 'ObjectLibrary/Enemy';
import AsteroidFragment from 'ObjectLibrary/AsteroidFragment';
import LightEnemyA from 'ObjectLibrary/LightEnemyA';
import LightEnemyB from 'ObjectLibrary/LightEnemyB';
import FadingArtifact from 'ObjectLibrary/FadingArtifact';
import ExplosionEngine from './ExplosionEngine';

export interface GameKeyState {
	ArrowUp: boolean;
	ArrowDown: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
	Space: boolean;
}

export enum GameObjectType {
	Asteroid,
	FadingArtifact,
	Enemy,
	SpaceshipBullet,
	EnemyBullet,
}

export interface GameObjectsMap {
	[GameObjectType.Asteroid]: Asteroid[];
	[GameObjectType.FadingArtifact]: FadingArtifact[];
	[GameObjectType.Enemy]: Enemy[];
	[GameObjectType.SpaceshipBullet]: Bullet[];
	[GameObjectType.EnemyBullet]: Bullet[];
}

const createBlankGameObjectMap = () =>
	({
		[GameObjectType.Asteroid]: [],
		[GameObjectType.FadingArtifact]: [],
		[GameObjectType.Enemy]: [],
		[GameObjectType.SpaceshipBullet]: [],
		[GameObjectType.EnemyBullet]: [],
	} as GameObjectsMap);

export default class GameEngine {
	// 3D objects
	sceneObjectArray: SceneObject[] = [];
	spaceship?: Spaceship;
	gameObjects = createBlankGameObjectMap();
	gameObjectsToAdd = createBlankGameObjectMap();
	gameObjectsToRemove = createBlankGameObjectMap();

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

	// Asteroids
	totalAsteroidsTarget = 0;
	asteroidDenity = 20;

	// Enemies
	totalEnemiesTarget = 3;

	// Other engines
	explosionEngine: ExplosionEngine;

	constructor(threeEngine: ThreeEngine) {
		this.threeEngine = threeEngine;
		this.recalculateVisibleDistance();
		this.explosionEngine = new ExplosionEngine(this.addFadingArtifacts);
	}

	setMaxVisibleDistance = (distance: number) => {
		this.maxVisibleDistance = distance;
		this.totalAsteroidsTarget = Math.floor(this.asteroidDenity * distance);
		this.spaceship?.setMaxVisibleDistance(distance);
		[
			...this.gameObjects[GameObjectType.SpaceshipBullet],
			...this.gameObjects[GameObjectType.EnemyBullet],
			...this.gameObjects[GameObjectType.Asteroid],
			...this.gameObjects[GameObjectType.Enemy],
		].forEach((enemy) => {
			enemy.setMaxVisibleDistance(distance);
		});
	};

	recalculateVisibleDistance = () => {
		const { height, width } = this.threeEngine.getVisibleHeightAndWidth();
		this.setMaxVisibleDistance(Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2)) / 2);
	};

	initialise = () => {
		console.log('GameEngine initialised');

		this.recalculateVisibleDistance();

		const spaceshipSize = 0.5;

		const spaceship = new Spaceship({
			size: spaceshipSize,
			getGameObjectsToAdd: () => this.gameObjectsToAdd,
			explosionEngine: this.explosionEngine,
			maxVisibleDistance: this.maxVisibleDistance,
		});

		this.spaceship = spaceship;
		this.addToScene([spaceship]);

		this.threeEngine.setOnAnimate(this.onAnimate);

		this.addRandomAsteroids(this.totalAsteroidsTarget, 4, this.maxVisibleDistance + 5);
	};

	dispose = () => {
		console.log('GameEngine disposed');
		// clear objects from scene
		this.threeEngine.removeFromScene(this.sceneObjectArray.map((object) => object._object3d));
		this.sceneObjectArray = [];

		this.gameObjects = createBlankGameObjectMap();

		this.gameObjectsToAdd = createBlankGameObjectMap();
		this.gameObjectsToRemove = createBlankGameObjectMap();

		this.spaceship = undefined;
		this.threeEngine.setOnAnimate(undefined);
	};

	addToScene = (objects: SceneObject[]) => {
		this.sceneObjectArray = this.sceneObjectArray.concat(objects);
		this.threeEngine.addToScene(objects.map((object) => object._object3d));
	};

	removeFromScene = (objects: SceneObject[]) => {
		this.sceneObjectArray = this.sceneObjectArray.filter((sceneObject) => !objects.includes(sceneObject));
		this.threeEngine.removeFromScene(objects.map((object) => object._object3d));
	};

	getSpaceship = () => {
		if (this.spaceship) {
			return this.spaceship;
		}
		throw new Error('Spaceship not found');
	};

	onAnimate = (frame: number) => {
		this.addObjectsToScene();
		const spaceship = this.getSpaceship();
		spaceship.beforeAnimate(frame, this.keyState);
		[...this.gameObjects[GameObjectType.SpaceshipBullet], ...this.gameObjects[GameObjectType.EnemyBullet]].forEach(
			(bullet) => {
				// check asteroids for collision
				if (frame % 2 === 0) {
					for (const asteroid of this.gameObjects[GameObjectType.Asteroid]) {
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
			},
		);
		this.gameObjects[GameObjectType.SpaceshipBullet].forEach((bullet) => {
			// check enemies for collision
			if (frame % 2 === 0 && !bullet.getShouldRemove()) {
				for (const enemy of this.gameObjects[GameObjectType.Enemy]) {
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
		this.gameObjects[GameObjectType.EnemyBullet].forEach((bullet) => {
			// check spaceship for collision
			if (frame % 2 === 0 && !bullet.getShouldRemove()) {
				spaceship.checkCollisionWithBullet(bullet);
			}
			if (!bullet.getShouldRemove()) {
				bullet.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.FadingArtifact].forEach((artifact) => {
			if (!artifact.getShouldRemove()) {
				artifact.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
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
		this.gameObjects[GameObjectType.Enemy].forEach((enemy) => {
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

		this.removeObjectsFromScene();

		if (this.totalAsteroidsTarget > this.gameObjects[GameObjectType.Asteroid].length) {
			this.addRandomAsteroids(
				this.totalAsteroidsTarget - this.gameObjects[GameObjectType.Asteroid].length,
				this.maxVisibleDistance + 6,
				this.maxVisibleDistance + 3,
			);
		}

		if (this.totalEnemiesTarget > this.gameObjects[GameObjectType.Enemy].length) {
			this.addRandomLightEnemies(
				this.totalEnemiesTarget - this.gameObjects[GameObjectType.Enemy].length,
				this.maxVisibleDistance + 6,
				this.maxVisibleDistance + 3,
			);
		}

		console.log('particles', this.gameObjects[GameObjectType.FadingArtifact].length);

		// run animation function on all objects
		this.sceneObjectArray.forEach((object) => object.animate());

		// align camera with spaceship
		this.threeEngine.setCameraPosition(spaceship._object3d.position.x, spaceship._object3d.position.y);
	};

	removeObjectsFromScene = () => {
		const objectsToRemove = this.sceneObjectArray.filter((object) => object.getShouldRemove());

		if (objectsToRemove.length > 0) {
			this.removeFromScene(objectsToRemove);
			objectsToRemove.forEach((object) => object.dispose());
			this.gameObjects[GameObjectType.SpaceshipBullet] = this.gameObjects[GameObjectType.SpaceshipBullet].filter(
				(bullet) => !bullet.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.EnemyBullet] = this.gameObjects[GameObjectType.EnemyBullet].filter(
				(bullet) => !bullet.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.Asteroid] = this.gameObjects[GameObjectType.Asteroid].filter(
				(asteroid) => !asteroid.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.FadingArtifact] = this.gameObjects[GameObjectType.FadingArtifact].filter(
				(artifact) => !artifact.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.Enemy] = this.gameObjects[GameObjectType.Enemy].filter(
				(enemy) => !enemy.getShouldRemove(),
			);
		}
	};

	addObjectsToScene = () => {
		const objectsToAdd: SceneObject[] = [];
		this.gameObjectsToAdd[GameObjectType.SpaceshipBullet].forEach((bullet) => {
			this.gameObjects[GameObjectType.SpaceshipBullet].push(bullet);
			objectsToAdd.push(bullet);
		});
		this.gameObjectsToAdd[GameObjectType.EnemyBullet].forEach((bullet) => {
			this.gameObjects[GameObjectType.EnemyBullet].push(bullet);
			objectsToAdd.push(bullet);
		});
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].forEach((asteroidFragment) => {
			this.gameObjects[GameObjectType.FadingArtifact].push(asteroidFragment);
			objectsToAdd.push(asteroidFragment);
		});
		this.gameObjectsToAdd[GameObjectType.Enemy].forEach((enemy) => {
			this.gameObjects[GameObjectType.Enemy].push(enemy);
			objectsToAdd.push(enemy);
		});
		this.gameObjectsToAdd[GameObjectType.Asteroid].forEach((asteroid) => {
			this.gameObjects[GameObjectType.Asteroid].push(asteroid);
			objectsToAdd.push(asteroid);
		});

		if (objectsToAdd.length === 0) return;
		this.addToScene(objectsToAdd);

		this.gameObjectsToAdd = createBlankGameObjectMap();
	};

	addAsteroidFragment = (asteroidFragment: AsteroidFragment) => {
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(asteroidFragment);
	};

	addAsteroids = (...asteroids: Asteroid[]) => {
		this.gameObjectsToAdd[GameObjectType.Asteroid].push(...asteroids);
	};

	addFadingArtifacts = (...artifacts: FadingArtifact[]) => {
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(...artifacts);
	};

	addRandomAsteroids = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const randomAsteroidSize = Math.random() > 0.5 ? AsteroidSize.LARGE : AsteroidSize.SMALL;
			this.addAsteroids(
				new Asteroid({
					size: randomAsteroidSize,
					startingPosition: {
						x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
						y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
					},
					maxVisibleDistance: this.maxVisibleDistance,
					addAsteroids: this.addAsteroids,
					addAsteroidFragments: this.addAsteroidFragment,
					explosionEngine: this.explosionEngine,
				}),
			);
		}
	};

	addRandomLightEnemies = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const EnemyClass = Math.random() > 0.5 ? LightEnemyA : LightEnemyB;
			const enemy = new EnemyClass({
				startingPosition: {
					x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
					y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
				},
				getGameObjectsToAdd: () => this.gameObjectsToAdd,
				explosionEngine: this.explosionEngine,
				maxVisibleDistance: this.maxVisibleDistance,
			});
			this.gameObjectsToAdd[GameObjectType.Enemy].push(enemy);
		}
	};

	calculateSpaceshipProximity = (object: GameObject) => {
		const spaceship = this.getSpaceship();
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
				this.getSpaceship().fireBullet();
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
				this.getSpaceship().bulletAvailable = true;
				// stop firing
				break;
		}
	};
}
