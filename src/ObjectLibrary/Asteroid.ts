import * as THREE from 'three';
import AsteroidFragment from './AsteroidFragment';
import Bullet from './Bullet';
import GameObject from './GameObject';
import SceneObject, { PartialAnimationSpeeds } from './SceneObject';
import Spaceship from './Spaceship';

const baseSize = 0.3;
const baseCoefficient = 1;

const material = new THREE.MeshLambertMaterial({
	color: 0xeaeaea,
});
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

export enum AsteroidSize {
	SMALL,
	LARGE,
}

const AsteroidSizeMap = {
	[AsteroidSize.SMALL]: 1,
	[AsteroidSize.LARGE]: 2,
};

export default class Asteroid extends GameObject {
	radius: number;
	size: AsteroidSize;
	addAsteroid: (asteroid: Asteroid) => void;
	addAsteroidFragment: (asteroidFragment: AsteroidFragment) => void;
	addExplosion: (
		impactAngle: number,
		travelAngle: number,
		impactPosition: THREE.Vector3,
		travelPosition: THREE.Vector3,
	) => void;

	constructor(
		options: {
			size?: AsteroidSize;
			sides?: number;
			animationSpeeds?: PartialAnimationSpeeds;
			startingPosition?: { x: number; y: number };
			startingRotation?: number;
		},
		maxVisibleDistance: number,
		addAsteroid: (asteroid: Asteroid) => void,
		addAsteroidFragment: (asteroidFragment: AsteroidFragment) => void,
		addExplosion: (
			impactAngle: number,
			travelAngle: number,
			impactPosition: THREE.Vector3,
			travelPosition: THREE.Vector3,
		) => void,
	) {
		const size = options.size || AsteroidSize.SMALL;
		const sides = options.sides || Math.floor(Math.random() * 3) + 6;
		const animationSpeeds = options.animationSpeeds || ({} as PartialAnimationSpeeds);
		const startingPosition = options.startingPosition || { x: 0, y: 0 };
		const startingRotation = options.startingRotation || 0;

		const calculatedRadius = baseSize * AsteroidSizeMap[size];
		// create ateroid shape
		const asteroidShape = new THREE.Shape();
		asteroidShape.moveTo(calculatedRadius, 0);
		const coefficient = baseCoefficient / sides;
		for (let i = 1; i < sides; i++) {
			const randomMovement =
				Math.random() * calculatedRadius * coefficient - (calculatedRadius * coefficient) / 2;
			asteroidShape.lineTo(
				Math.cos((i * 2 * Math.PI) / sides) * calculatedRadius + randomMovement,
				Math.sin((i * 2 * Math.PI) / sides) * calculatedRadius + randomMovement,
			);
		}

		const geometry = new THREE.ShapeGeometry(asteroidShape);
		const asteroid = new THREE.Mesh(geometry, material);

		// asteroid outline
		const outline = new THREE.EdgesGeometry(geometry);
		const outlineMesh = new THREE.LineSegments(outline, outlineMaterial);

		asteroid.add(outlineMesh);

		asteroid.position.x = startingPosition.x;
		asteroid.position.y = startingPosition.y;

		asteroid.rotation.z = startingRotation;

		super(asteroid);
		this.radius = calculatedRadius;
		this.size = size;

		this._disposableGeometries.push(geometry, outline);
		this._meshes.push(asteroid);

		this.setMaxVisibleDistance(maxVisibleDistance);

		this.setAnimationSpeeds({
			position: animationSpeeds.position || {
				x: Math.random() * 0.01 - 0.005,
				y: Math.random() * 0.01 - 0.005,
			},
			rotation: {
				z: animationSpeeds.rotation?.z || 0,
			},
		});

		this.addAsteroid = addAsteroid;
		this.addExplosion = addExplosion;
		this.addAsteroidFragment = addAsteroidFragment;
	}

	beforeAnimate = (frame: number) => {
		const distanceToSpaceship = this.getDistanceToSpaceship();
		const maxVisibleDistance = this.getMaxVisibleDistance();
		if (distanceToSpaceship === undefined || maxVisibleDistance === undefined) return;
		if (distanceToSpaceship > maxVisibleDistance + 5) {
			this.setShouldRemove(true);
		}
	};

	checkForBulletCollision = (bullet: Bullet, distance: number) => {
		if (distance < this.radius) {
			this.setShouldRemove(true);
			bullet.setShouldRemove(true);
			this.collision(bullet);
			return true;
		}
		return false;
	};

	checkForSpaceshipCollision = (spaceship: Spaceship) => {
		const distanceToSpaceship = this.getDistanceToSpaceship();
		if (distanceToSpaceship !== undefined && distanceToSpaceship < this.radius) {
			this.collision(spaceship);
			spaceship.handleCollision();
		}
	};

	addRandomAsteroidFragment = (rotationAngle: number) => {
		const zSpeed = Math.random() * 3 - 1.5;
		this.addAsteroidFragment(
			new AsteroidFragment({
				color: 0x000000,
				size: 0.05,
				sides: 4,
				animationSpeeds: {
					position: {
						x: Math.sin(rotationAngle) / 60 / Math.max(0.5, zSpeed),
						y: Math.cos(rotationAngle) / 60 / Math.max(0.5, zSpeed),
						z: zSpeed,
					},
					rotation: {
						z: Math.random() * 0.2 - 0.1,
					},
				},
				startingPosition: {
					x: this._object3d.position.x + Math.sin(rotationAngle) / 10,
					y: this._object3d.position.y + Math.cos(rotationAngle) / 10,
				},
				lifetime: Math.random() * 0.6 + 0.7,
			}),
		);
	};

	collision = (collidingObject: SceneObject) => {
		const impactAngle = Math.atan2(
			collidingObject._object3d.position.y - this._object3d.position.y,
			collidingObject._object3d.position.x - this._object3d.position.x,
		);
		const travelAngle = Math.atan2(
			collidingObject._animationSpeeds.position.x,
			collidingObject._animationSpeeds.position.y,
		);
		this.addExplosion(impactAngle, travelAngle, collidingObject._object3d.position, this._object3d.position);
		if (this.size === AsteroidSize.LARGE) {
			// split into smaller asteroids
			const maxVisibleDistance = this.getMaxVisibleDistance();
			if (maxVisibleDistance === undefined) return;
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
							x: this._object3d.position.x + Math.sin(rotationAngle) / 10,
							y: this._object3d.position.y + Math.cos(rotationAngle) / 10,
						},
					},
					maxVisibleDistance,
					this.addAsteroid,
					this.addAsteroidFragment,
					this.addExplosion,
				),
			);
			this.addRandomAsteroidFragment(rotationAngle + quarterTurn + Math.random());
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
							x: this._object3d.position.x + Math.sin(rotationAngle) / 10,
							y: this._object3d.position.y + Math.cos(rotationAngle) / 10,
						},
					},
					maxVisibleDistance,
					this.addAsteroid,
					this.addAsteroidFragment,
					this.addExplosion,
				),
			);
			this.addRandomAsteroidFragment(rotationAngle + quarterTurn + Math.random());
		}
		this.addRandomAsteroidFragment(travelAngle + Math.PI / 2 + Math.random());
		this.addRandomAsteroidFragment(travelAngle + Math.random());
		this.setShouldRemove(true);
	};
}
