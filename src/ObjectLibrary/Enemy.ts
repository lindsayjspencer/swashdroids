import { GameObjectsMap, GameObjectType, IAddExplosion } from 'Engines/GameEngine';
import * as THREE from 'three';
import Particle from './Particle';
import GameObject from './GameObject';
import SceneObject, { PartialAnimationSpeeds } from './SceneObject';
import Bullet from './Bullet';
import { ColorRepresentation } from 'three';
import ThreeHelper from 'Helpers/ThreeHelper';
import Spaceship from './Spaceship';

export default class Enemy extends GameObject {
	acceleration = 0;
	speed = {
		x: 0,
		y: 0,
		rotation: 0,
	};
	dragFactor: number;
	maxAcceleration: number;
	getGameObjectsToAdd: () => GameObjectsMap;
	addExplosion: IAddExplosion;
	targetAngle: number;
	bulletFireOffset: number;
	bulletFirePeriod?: number;
	exhaustColour: ColorRepresentation;
	exhaustParticlesPerSecond: number;
	decelerateDistance: number;
	hitboxRadius: number;
	health: number;

	constructor(options: {
		mesh: THREE.Mesh;
		hitboxRadius: number;
		animationSpeeds?: PartialAnimationSpeeds;
		startingPosition?: { x: number; y: number };
		startingRotation?: number;
		targetAngle?: number;
		bulletFireOffset?: number;
		bulletFirePeriod?: number;
		maxAcceleration?: number;
		dragFactor?: number;
		decelerateDistance?: number;
		exhaustColour?: ColorRepresentation;
		exhaustParticlesPerSecond?: number;
		health?: number;
		getGameObjectsToAdd: () => GameObjectsMap;
		addExplosion: IAddExplosion;
	}) {
		super(options.mesh);

		this.targetAngle = options.targetAngle ?? Math.random() * (Math.PI / 4) - Math.PI / 8;
		this.bulletFireOffset = options.bulletFireOffset ?? Math.floor(Math.random() * 60);
		this.bulletFirePeriod = options.bulletFirePeriod;
		this.exhaustColour = options.exhaustColour ?? 0xf505ed;
		this.exhaustParticlesPerSecond = options.exhaustParticlesPerSecond ?? 30;

		this.maxAcceleration = options.maxAcceleration ?? 0.001;
		this.dragFactor = options.dragFactor ?? 0.97;
		this.decelerateDistance = options.decelerateDistance ?? 2;

		this.hitboxRadius = options.hitboxRadius;
		this.health = options.health ?? 1;

		this.getGameObjectsToAdd = options.getGameObjectsToAdd;
		this.addExplosion = options.addExplosion;
	}

	beforeAnimate = (frame: number) => {
		// implement in extending classes
	};

	headTowardsSpaceship = (frame: number) => {
		const ang = this.getAngleToSpaceship();
		const distance = this.getDistanceToSpaceship();
		if (ang === undefined || distance === undefined) return;
		if (distance > this.decelerateDistance) {
			const shortestAngleBetween = ThreeHelper.getShortestAngleBetween(
				this._object3d.rotation.z,
				ang + this.targetAngle,
			);
			this.speed.rotation = shortestAngleBetween / 10;
			// modify speed
			this.speed.x += this.maxAcceleration * Math.cos(this._object3d.rotation.z - Math.PI);
			this.speed.y += this.maxAcceleration * Math.sin(this._object3d.rotation.z - Math.PI);
			// apply drag
			this.speed.x *= this.dragFactor;
			this.speed.y *= this.dragFactor;
			// exhaust particles
			if (frame % Math.floor(60 / this.exhaustParticlesPerSecond) === 0) {
				this.addExhaustParticle();
			}
		} else {
			const shortestAngleBetween = ThreeHelper.getShortestAngleBetween(this._object3d.rotation.z, ang);
			this.speed.rotation = shortestAngleBetween / 10;
			this.speed.x *= this.dragFactor;
			this.speed.y *= this.dragFactor;
			if (this.bulletFirePeriod !== undefined && (frame + this.bulletFireOffset) % this.bulletFirePeriod === 0) {
				this.fireBullet();
			}
		}
		this.setAnimationSpeeds({
			position: {
				x: this.speed.x,
				y: this.speed.y,
			},
			rotation: {
				z: this.speed.rotation,
			},
		});
	};

	addExhaustParticle = () => {
		const randomRotationAngle = -this._object3d.rotation.z + Math.PI / 2 + Math.random() * 0.3 - 0.15;
		const particle = new Particle({
			color: 0xf505ed,
			size: 0.02,
			speed: {
				x: Math.sin(randomRotationAngle) / (Math.random() * 30 + 25),
				y: Math.cos(randomRotationAngle) / (Math.random() * 30 + 25),
			},
			startingPosition: {
				x:
					this._object3d.position.x +
					(Math.random() * 0.08 - 0.04) +
					Math.sin(randomRotationAngle) * this.hitboxRadius,
				y:
					this._object3d.position.y +
					(Math.random() * 0.08 - 0.04) +
					Math.cos(randomRotationAngle) * this.hitboxRadius,
			},
			lifetime: Math.random() * 1,
		});
		this.getGameObjectsToAdd()[GameObjectType.FadingArtifact].push(particle);
	};

	fireBullet = () => {
		const maxVisibleDistance = this.getMaxVisibleDistance();
		if (maxVisibleDistance === undefined) return;
		const rotationAngle = -this._object3d.rotation.z - Math.PI / 2;
		const bullet = new Bullet(
			0.03,
			{
				x: Math.sin(rotationAngle) / 6,
				y: Math.cos(rotationAngle) / 6,
			},
			{
				x: this._object3d.position.x + Math.sin(rotationAngle) / 10,
				y: this._object3d.position.y + Math.cos(rotationAngle) / 10,
			},
			maxVisibleDistance,
		);
		this.getGameObjectsToAdd()[GameObjectType.EnemyBullet].push(bullet);
	};

	checkForBulletCollision = (bullet: Bullet, distance: number) => {
		if (distance < this.hitboxRadius) {
			bullet.setShouldRemove(true);
			if (this.health - bullet.damage > 0) {
				this.health -= bullet.damage;
			} else {
				this.setShouldRemove(true);
			}
			this.collision(bullet);
			return true;
		}
		return false;
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
		this.addExplosion(
			{
				angle: () => impactAngle + (Math.random() * 0.5 - 0.25),
				position: {
					x: collidingObject._object3d.position.x,
					y: collidingObject._object3d.position.y,
				},
				particles: {
					amount: 3,
				},
			},
			{
				angle: () => travelAngle + (Math.random() * 0.2 - 0.1),
				position: {
					x: collidingObject._object3d.position.x,
					y: collidingObject._object3d.position.y,
				},
				particles: {
					amount: 10,
				},
			},
			{
				position: {
					x: this._object3d.position.x,
					y: this._object3d.position.y,
				},
				particles: {
					amount: this.getShouldRemove() ? 18 : 0,
				},
			},
		);
	};

	checkForSpaceshipCollision = (spaceship: Spaceship) => {
		const distanceToSpaceship = this.getDistanceToSpaceship();
		if (distanceToSpaceship !== undefined && distanceToSpaceship < this.hitboxRadius) {
			if (this.health - spaceship.damage > 0) {
				this.health -= spaceship.damage;
			} else {
				this.setShouldRemove(true);
			}
			this.collision(spaceship);
			spaceship.handleCollision();
		}
	};
}
