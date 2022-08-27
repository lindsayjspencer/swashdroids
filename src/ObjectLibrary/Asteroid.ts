import * as THREE from 'three';
import Bullet from './Bullet';
import GameObject from './GameObject';
import { PartialAnimationSpeeds } from './SceneObject';

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
	collidingBullet?: Bullet;
	collidingWithSpaceship = false;

	constructor(
		options: {
			size?: AsteroidSize;
			sides?: number;
			animationSpeeds?: PartialAnimationSpeeds;
			startingPosition?: { x: number; y: number };
			startingRotation?: number;
		},
		maxVisibleDistance: number,
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
			this.collidingBullet = bullet;
			this.setShouldRemove(true);
			bullet.setShouldRemove(true);
		}
	};

	checkForSpaceshipCollision = () => {
		const distanceToSpaceship = this.getDistanceToSpaceship();
		if (distanceToSpaceship !== undefined && distanceToSpaceship < this.radius) {
			this.collidingWithSpaceship = true;
		}
	};
}
