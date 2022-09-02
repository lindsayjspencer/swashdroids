import Asteroid, { AsteroidSize } from 'ObjectLibrary/Asteroid';
import Bullet from 'ObjectLibrary/Bullet';
import SceneObject from 'ObjectLibrary/SceneObject';
import GameObject from 'ObjectLibrary/GameObject';
import Particle from 'ObjectLibrary/Particle';
import Spaceship from 'ObjectLibrary/Spaceship';
import ThreeEngine from './ThreeEngine';
import { Vector3 } from 'three';
import CrashEnemy from 'ObjectLibrary/CrashEnemy';

export interface GameKeyState {
	ArrowUp: boolean;
	ArrowDown: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
	Space: boolean;
}

export enum GameObjectType {
	Asteroid,
	CrashEnemy,
	Bullet,
	ExhaustParticle,
	ExplosionParticle,
}

const createBlankGameObjectMap = () => ({
	[GameObjectType.Asteroid]: [] as Asteroid[],
	[GameObjectType.CrashEnemy]: [] as CrashEnemy[],
	[GameObjectType.Bullet]: [] as Bullet[],
	[GameObjectType.ExhaustParticle]: [] as Particle[],
	[GameObjectType.ExplosionParticle]: [] as Particle[],
});

export default class GameEngine {
	sceneObjectArray: SceneObject[] = [];
	spaceship?: Spaceship;
	gameObjects = createBlankGameObjectMap();
	gameObjectsToAdd = createBlankGameObjectMap();
	gameObjectsToRemove = createBlankGameObjectMap();
	bulletAvailable = true;
	threeEngine: ThreeEngine;
	keyState: GameKeyState = {
		ArrowUp: false,
		ArrowDown: false,
		ArrowLeft: false,
		ArrowRight: false,
		Space: false,
	};
	totalAsteroidsTarget = 0;
	asteroidDenity = 100;
	maxVisibleDistance = 0;

	constructor(threeEngine: ThreeEngine) {
		this.threeEngine = threeEngine;
		this.recalculateVisibleDistance();
	}

	setMaxVisibleDistance = (distance: number) => {
		this.maxVisibleDistance = distance;
		this.totalAsteroidsTarget = Math.floor(this.asteroidDenity * distance);
		this.gameObjects[GameObjectType.Bullet].forEach((bullet) => {
			bullet.setMaxVisibleDistance(distance);
		});
		this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
			asteroid.setMaxVisibleDistance(distance);
		});
		this.gameObjects[GameObjectType.CrashEnemy].forEach((crashEnemy) => {
			crashEnemy.setMaxVisibleDistance(distance);
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

		const spaceship = new Spaceship(spaceshipSize);

		this.addToScene([spaceship]);
		this.spaceship = spaceship;

		const crashEnemy = new CrashEnemy(
			{
				startingPosition: {
					x: 2,
					y: 1,
				},
			},
			1,
			this.maxVisibleDistance,
		);
		this.gameObjectsToAdd[GameObjectType.CrashEnemy].push(crashEnemy);

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

	addExplosion = (impactAngle: number, travelAngle: number, impactPosition: Vector3, explosionPosition: Vector3) => {
		// Add explosion particles
		for (let i = 0; i < 3; i++) {
			const zSpeed = Math.random() * 3 - 1.5;
			const particle = new Particle({
				color: 0xf5aa42,
				size: 0.03,
				speed: {
					x: Math.sin(impactAngle) / (Math.random() * 30 + 25) / Math.max(1, Math.abs(zSpeed)),
					y: Math.cos(impactAngle) / (Math.random() * 30 + 25) / Math.max(1, Math.abs(zSpeed)),
					z: zSpeed,
				},
				startingPosition: {
					x: impactPosition.x + (Math.random() * 0.08 - 0.04) + Math.sin(impactAngle) / 8,
					y: impactPosition.y + (Math.random() * 0.08 - 0.04) + Math.cos(impactAngle) / 8,
				},
				opacity: Math.random(),
				lifetime: Math.random() * 0.5,
			});
			this.gameObjectsToAdd[GameObjectType.ExplosionParticle].push(particle);
		}
		for (let i = 0; i < 12; i++) {
			const zSpeed = Math.random() * 3 - 1.5;
			const particle = new Particle({
				color: 0xf5aa42,
				size: 0.03,
				speed: {
					x: Math.sin(travelAngle) / (Math.random() * 30 + 25) / Math.max(1, Math.abs(zSpeed)),
					y: Math.cos(travelAngle) / (Math.random() * 30 + 25) / Math.max(1, Math.abs(zSpeed)),
					z: zSpeed,
				},
				startingPosition: {
					x: impactPosition.x + (Math.random() * 0.08 - 0.04) + Math.sin(travelAngle) / 8,
					y: impactPosition.y + (Math.random() * 0.08 - 0.04) + Math.cos(travelAngle) / 8,
				},
				opacity: Math.random(),
				lifetime: Math.random() * 0.5,
			});
			this.gameObjectsToAdd[GameObjectType.ExplosionParticle].push(particle);
		}
		for (let i = 0; i < 10; i++) {
			const zSpeed = Math.random() * 3 - 1.5;
			const randomAngle = Math.random() * Math.PI * 2;
			const randomSpeed = Math.random() * 0.01 + 0.01;
			const particle = new Particle({
				color: 0x000000,
				size: 0.03,
				speed: {
					x: (Math.sin(randomAngle) * randomSpeed) / Math.max(1, Math.abs(zSpeed)),
					y: (Math.cos(randomAngle) * randomSpeed) / Math.max(1, Math.abs(zSpeed)),
					z: zSpeed,
				},
				startingPosition: {
					x: explosionPosition.x + Math.sin(randomAngle) * randomSpeed * 3,
					y: explosionPosition.y + Math.cos(randomAngle) * randomSpeed * 3,
				},
				opacity: Math.random(),
				lifetime: Math.random() * 1.5,
			});
			this.gameObjectsToAdd[GameObjectType.ExplosionParticle].push(particle);
		}
	};

	asteroidCollision = (asteroid: Asteroid, collidingObject: SceneObject) => {
		const impactAngle = Math.atan2(
			collidingObject._object3d.position.y - asteroid._object3d.position.y,
			collidingObject._object3d.position.x - asteroid._object3d.position.x,
		);
		const travelAngle = Math.atan2(
			collidingObject._animationSpeeds.position.x,
			collidingObject._animationSpeeds.position.y,
		);
		this.addExplosion(impactAngle, travelAngle, collidingObject._object3d.position, asteroid._object3d.position);
		if (asteroid.size === AsteroidSize.LARGE) {
			// split into smaller asteroids
			const quarterTurn = Math.PI / 4;
			let rotationAngle = travelAngle + quarterTurn + Math.random() * 0.4 - 0.2;
			this.addAsteroid(
				new Asteroid(
					{
						animationSpeeds: {
							position: {
								x: Math.sin(rotationAngle) / 60,
								y: Math.cos(rotationAngle) / 60,
							},
						},
						startingPosition: {
							x: asteroid._object3d.position.x + Math.sin(rotationAngle) / 10,
							y: asteroid._object3d.position.y + Math.cos(rotationAngle) / 10,
						},
					},
					this.maxVisibleDistance,
				),
			);
			rotationAngle = travelAngle - quarterTurn + Math.random() * 0.4 - 0.2;
			this.addAsteroid(
				new Asteroid(
					{
						animationSpeeds: {
							position: {
								x: Math.sin(rotationAngle) / 60,
								y: Math.cos(rotationAngle) / 60,
							},
						},
						startingPosition: {
							x: asteroid._object3d.position.x + Math.sin(rotationAngle) / 10,
							y: asteroid._object3d.position.y + Math.cos(rotationAngle) / 10,
						},
					},
					this.maxVisibleDistance,
				),
			);
		}
		asteroid.setShouldRemove(true);
	};

	onAnimate = (frame: number) => {
		this.addObjectsToScene();
		const spaceship = this.getSpaceship();
		spaceship.beforeAnimate(frame, this.keyState);
		// exhaust particles
		if (this.keyState.ArrowUp && frame % 2 === 0) {
			const randomRotationAngle = -spaceship._object3d.rotation.z - Math.PI + Math.random() * 0.3 - 0.15;
			const particle = new Particle({
				color: 0x71bd31,
				size: 0.03,
				speed: {
					x: Math.sin(randomRotationAngle) / (Math.random() * 30 + 25),
					y: Math.cos(randomRotationAngle) / (Math.random() * 30 + 25),
				},
				startingPosition: {
					x:
						spaceship._object3d.position.x +
						(Math.random() * 0.08 - 0.04) +
						Math.sin(randomRotationAngle) / 8,
					y:
						spaceship._object3d.position.y +
						(Math.random() * 0.08 - 0.04) +
						Math.cos(randomRotationAngle) / 8,
				},
			});
			this.gameObjectsToAdd[GameObjectType.ExhaustParticle].push(particle);
		}
		this.gameObjects[GameObjectType.Bullet].forEach((bullet) => {
			// check asteroids for collision
			if (frame % 3 === 0) {
				this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
					const distance = this.threeEngine.calculateDistanceBetweenObjects(
						bullet._object3d,
						asteroid._object3d,
					);
					asteroid.checkForBulletCollision(bullet, distance);
					if (asteroid.collidingBullet) {
						this.asteroidCollision(asteroid, asteroid.collidingBullet);
						asteroid.collidingBullet = undefined;
					}
				});
				// update spaceship proximity
				this.calculateSpaceshipProximity(bullet);
			}
			if (bullet.getShouldRemove()) {
				this.gameObjectsToRemove[GameObjectType.Bullet].push(bullet);
			} else {
				bullet.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.ExhaustParticle].forEach((particle) => {
			if (particle.getShouldRemove()) {
				this.gameObjectsToRemove[GameObjectType.ExhaustParticle].push(particle);
			} else {
				particle.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.ExplosionParticle].forEach((particle) => {
			if (particle.getShouldRemove()) {
				this.gameObjectsToRemove[GameObjectType.ExplosionParticle].push(particle);
			} else {
				particle.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
			if ((frame + 1) % 3 === 0) {
				// update spaceship proximity
				this.calculateSpaceshipProximity(asteroid);
			}
			asteroid.checkForSpaceshipCollision();
			if (asteroid.collidingWithSpaceship) {
				this.asteroidCollision(asteroid, spaceship);
				asteroid.collidingWithSpaceship = false;
			}
			if (asteroid.getShouldRemove()) {
				this.gameObjectsToRemove[GameObjectType.Asteroid].push(asteroid);
			} else {
				asteroid.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.CrashEnemy].forEach((enemy) => {
			if ((frame + 2) % 3 === 0) {
				// update spaceship proximity
				this.calculateSpaceshipProximity(enemy);
			}
			if (enemy.getShouldRemove()) {
				this.gameObjectsToRemove[GameObjectType.CrashEnemy].push(enemy);
			} else {
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

		// run animation function on all objects
		this.sceneObjectArray.forEach((object) => object.animate());

		// align camera with spaceship
		this.threeEngine.setCameraPosition(spaceship._object3d.position.x, spaceship._object3d.position.y);
	};

	removeObjectsFromScene = () => {
		const objectsToRemove: SceneObject[] = [];
		const bulletsToRemove: SceneObject[] = [];
		this.gameObjectsToRemove[GameObjectType.Bullet].forEach((bullet) => {
			bulletsToRemove.push(bullet);
			objectsToRemove.push(bullet);
		});
		this.gameObjects[GameObjectType.Bullet] = this.gameObjects[GameObjectType.Bullet].filter(
			(bullet) => !bulletsToRemove.includes(bullet),
		);

		const asteroidsToRemove: SceneObject[] = [];
		this.gameObjectsToRemove[GameObjectType.Asteroid].forEach((asteroid) => {
			asteroidsToRemove.push(asteroid);
			objectsToRemove.push(asteroid);
		});
		this.gameObjects[GameObjectType.Asteroid] = this.gameObjects[GameObjectType.Asteroid].filter(
			(asteroid) => !asteroidsToRemove.includes(asteroid),
		);

		const crashEnemyToRemove: SceneObject[] = [];
		this.gameObjectsToRemove[GameObjectType.CrashEnemy].forEach((crashEnemy) => {
			crashEnemyToRemove.push(crashEnemy);
			objectsToRemove.push(crashEnemy);
		});
		this.gameObjects[GameObjectType.Asteroid] = this.gameObjects[GameObjectType.Asteroid].filter(
			(asteroid) => !asteroidsToRemove.includes(asteroid),
		);

		const exhaustParticlesToRemove: SceneObject[] = [];
		this.gameObjectsToRemove[GameObjectType.ExhaustParticle].forEach((particle) => {
			exhaustParticlesToRemove.push(particle);
			objectsToRemove.push(particle);
		});
		this.gameObjects[GameObjectType.ExhaustParticle] = this.gameObjects[GameObjectType.ExhaustParticle].filter(
			(particle) => !exhaustParticlesToRemove.includes(particle),
		);

		const explosionParticlesToRemove: SceneObject[] = [];
		this.gameObjectsToRemove[GameObjectType.ExplosionParticle].forEach((particle) => {
			explosionParticlesToRemove.push(particle);
			objectsToRemove.push(particle);
		});
		this.gameObjects[GameObjectType.ExplosionParticle] = this.gameObjects[GameObjectType.ExplosionParticle].filter(
			(particle) => !explosionParticlesToRemove.includes(particle),
		);

		if (objectsToRemove.length > 0) {
			this.removeFromScene(objectsToRemove);
			objectsToRemove.forEach((object) => object.dispose());
		}

		this.gameObjectsToRemove = createBlankGameObjectMap();
	};

	addObjectsToScene = () => {
		const objectsToAdd: SceneObject[] = [];
		this.gameObjectsToAdd[GameObjectType.Bullet].forEach((bullet) => {
			this.gameObjects[GameObjectType.Bullet].push(bullet);
			objectsToAdd.push(bullet);
		});
		this.gameObjectsToAdd[GameObjectType.CrashEnemy].forEach((crashEnemy) => {
			this.gameObjects[GameObjectType.CrashEnemy].push(crashEnemy);
			objectsToAdd.push(crashEnemy);
		});
		this.gameObjectsToAdd[GameObjectType.ExhaustParticle].forEach((particle) => {
			this.gameObjects[GameObjectType.ExhaustParticle].push(particle);
			objectsToAdd.push(particle);
		});
		this.gameObjectsToAdd[GameObjectType.ExplosionParticle].forEach((particle) => {
			this.gameObjects[GameObjectType.ExplosionParticle].push(particle);
			objectsToAdd.push(particle);
		});
		this.gameObjectsToAdd[GameObjectType.Asteroid].forEach((asteroid) => {
			this.gameObjects[GameObjectType.Asteroid].push(asteroid);
			objectsToAdd.push(asteroid);
		});

		if (objectsToAdd.length === 0) return;
		this.addToScene(objectsToAdd);

		this.gameObjectsToAdd = createBlankGameObjectMap();
	};

	addAsteroid = (asteroid: Asteroid) => {
		this.gameObjectsToAdd[GameObjectType.Asteroid].push(asteroid);
	};

	addRandomAsteroids = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const randomAsteroidSize = Math.random() > 0.5 ? AsteroidSize.LARGE : AsteroidSize.SMALL;
			this.addAsteroid(
				new Asteroid(
					{
						size: randomAsteroidSize,
						startingPosition: {
							x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
							y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
						},
					},
					this.maxVisibleDistance,
				),
			);
		}
	};

	calculateSpaceshipProximity = (object: GameObject) => {
		const spaceship = this.getSpaceship();
		const distance = this.threeEngine.calculateDistanceBetweenObjects(object._object3d, spaceship._object3d);
		const angle = this.threeEngine.calculateAngleBetweenObjects(object._object3d, spaceship._object3d);
		object.setAngleToSpaceship(angle);
		object.setDistanceToSpaceship(distance);
	};

	fireBullet = () => {
		if (!this.bulletAvailable) return;
		const spaceship = this.getSpaceship();
		this.bulletAvailable = false;
		const rotationAngle = -spaceship._object3d.rotation.z;
		const bullet = new Bullet(
			0.03,
			{
				x: Math.sin(rotationAngle) / 6,
				y: Math.cos(rotationAngle) / 6,
			},
			{
				x: spaceship._object3d.position.x + Math.sin(rotationAngle) / 10,
				y: spaceship._object3d.position.y + Math.cos(rotationAngle) / 10,
			},
			this.maxVisibleDistance,
		);
		this.gameObjectsToAdd[GameObjectType.Bullet].push(bullet);
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
				this.fireBullet();
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
				this.bulletAvailable = true;
				// stop firing
				break;
		}
	};
}
