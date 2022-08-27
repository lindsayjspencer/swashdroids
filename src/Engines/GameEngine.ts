import Asteroid, { AsteroidSize } from 'ObjectLibrary/Asteroid';
import Bullet from 'ObjectLibrary/Bullet';
import SceneObject from 'ObjectLibrary/SceneObject';
import GameObject from 'ObjectLibrary/GameObject';
import Particle from 'ObjectLibrary/Particle';
import Spaceship from 'ObjectLibrary/Spaceship';
import ThreeEngine from './ThreeEngine';
import { Vector3 } from 'three';

export interface GameKeyState {
	ArrowUp: boolean;
	ArrowDown: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
	Space: boolean;
}

export enum GameObjectType {
	Asteroid,
	Bullet,
	ExhaustParticle,
	ExplosionParticle,
}

export default class GameEngine {
	sceneObjectArray: SceneObject[] = [];
	spaceship?: Spaceship;
	gameObjects = {
		[GameObjectType.Asteroid]: [] as Asteroid[],
		[GameObjectType.Bullet]: [] as Bullet[],
		[GameObjectType.ExhaustParticle]: [] as Particle[],
		[GameObjectType.ExplosionParticle]: [] as Particle[],
	};
	gameObjectsToAdd = {
		[GameObjectType.Asteroid]: [] as Asteroid[],
		[GameObjectType.Bullet]: [] as Bullet[],
		[GameObjectType.ExhaustParticle]: [] as Particle[],
		[GameObjectType.ExplosionParticle]: [] as Particle[],
	};
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
	asteroidDenity = 10;
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

		this.addToScene(spaceship);
		this.spaceship = spaceship;

		this.threeEngine.setOnAnimate(this.onAnimate);

		this.addRandomAsteroids(this.totalAsteroidsTarget, 4, this.maxVisibleDistance + 5);
	};

	dispose = () => {
		console.log('GameEngine disposed');
		// clear objects from scene
		this.sceneObjectArray.forEach((object) => this.threeEngine.removeFromScene(object._object3d));
		this.sceneObjectArray = [];

		this.gameObjects = {
			[GameObjectType.Asteroid]: [] as Asteroid[],
			[GameObjectType.Bullet]: [] as Bullet[],
			[GameObjectType.ExhaustParticle]: [] as Particle[],
			[GameObjectType.ExplosionParticle]: [] as Particle[],
		};

		this.gameObjectsToAdd = {
			[GameObjectType.Asteroid]: [] as Asteroid[],
			[GameObjectType.Bullet]: [] as Bullet[],
			[GameObjectType.ExhaustParticle]: [] as Particle[],
			[GameObjectType.ExplosionParticle]: [] as Particle[],
		};

		this.spaceship = undefined;
		this.threeEngine.setOnAnimate(undefined);
	};

	addToScene = (object: SceneObject) => {
		this.sceneObjectArray.push(object);
		this.threeEngine.addToScene(object._object3d);
	};

	removeFromScene = (object: SceneObject) => {
		this.sceneObjectArray = this.sceneObjectArray.filter((sceneObject) => sceneObject !== object);
		this.threeEngine.removeFromScene(object._object3d);
	};

	getSpaceship = () => {
		if (this.spaceship) {
			return this.spaceship;
		}
		throw new Error('Spaceship not found');
	};

	addExplosion = (impactAngle: number, travelAngle: number, impactPosition: Vector3, explosionPosition: Vector3) => {
		// Add explosion particles
		console.log('impact angle', impactAngle);
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
			this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
				const distance = this.threeEngine.calculateDistanceBetweenObjects(bullet._object3d, asteroid._object3d);
				asteroid.checkForBulletCollision(bullet, distance);
				if (asteroid.collidingBullet) {
					this.asteroidCollision(asteroid, asteroid.collidingBullet);
					asteroid.collidingBullet = undefined;
				}
			});
			// update spaceship proximity
			this.calculateSpaceshipProximity(bullet);
			if (!this.removeSceneObjectIfRequired(bullet, this.gameObjects[GameObjectType.Bullet])) {
				// if not removed, run before animation hook
				bullet.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.ExhaustParticle].forEach((particle) => {
			if (!this.removeSceneObjectIfRequired(particle, this.gameObjects[GameObjectType.ExhaustParticle])) {
				// if not removed, run before animation hook
				particle.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.ExplosionParticle].forEach((particle) => {
			if (!this.removeSceneObjectIfRequired(particle, this.gameObjects[GameObjectType.ExplosionParticle])) {
				// if not removed, run before animation hook
				particle.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
			// update spaceship proximity
			this.calculateSpaceshipProximity(asteroid);
			asteroid.checkForSpaceshipCollision();
			if (asteroid.collidingWithSpaceship) {
				this.asteroidCollision(asteroid, spaceship);
				asteroid.collidingWithSpaceship = false;
			}
			if (!this.removeSceneObjectIfRequired(asteroid, this.gameObjects[GameObjectType.Asteroid])) {
				// if not removed, run before animation hook
				asteroid.beforeAnimate(frame);
			}
		});

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

	addObjectsToScene = () => {
		this.gameObjectsToAdd[GameObjectType.Bullet].forEach((bullet) => {
			this.gameObjects[GameObjectType.Bullet].push(bullet);
			this.addToScene(bullet);
		});
		this.gameObjectsToAdd[GameObjectType.ExhaustParticle].forEach((particle) => {
			this.gameObjects[GameObjectType.ExhaustParticle].push(particle);
			this.addToScene(particle);
		});
		this.gameObjectsToAdd[GameObjectType.ExplosionParticle].forEach((particle) => {
			this.gameObjects[GameObjectType.ExplosionParticle].push(particle);
			this.addToScene(particle);
		});
		this.gameObjectsToAdd[GameObjectType.Asteroid].forEach((asteroid) => {
			this.gameObjects[GameObjectType.Asteroid].push(asteroid);
			this.addToScene(asteroid);
		});

		this.gameObjectsToAdd = {
			[GameObjectType.Bullet]: [],
			[GameObjectType.ExhaustParticle]: [],
			[GameObjectType.ExplosionParticle]: [],
			[GameObjectType.Asteroid]: [],
		};
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

	removeSceneObjectIfRequired = (object: SceneObject, specificArray: SceneObject[]) => {
		if (object.getShouldRemove()) {
			this.removeFromScene(object);
			specificArray.splice(specificArray.indexOf(object), 1);
			object.dispose();
			return true;
		}
		return false;
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
