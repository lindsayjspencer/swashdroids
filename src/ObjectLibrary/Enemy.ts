import { GameObjectsMap, GameObjectType } from 'Engines/GameEngine';
import * as THREE from 'three';
import Particle from './Particle';
import GameObject from './GameObject';
import SceneObject from './SceneObject';
import Bullet from './Bullet';
import { ColorRepresentation } from 'three';
import Spaceship from './Spaceship';
import ExplosionEngine from 'Engines/ExplosionEngine';
import TrigonometryHelper from 'Helpers/TrigonometryHelper';

export default class Enemy extends GameObject {
	// ----------------- //
	// Defaults: override these further down the inheritance chain
	// ----------------- //

	// Movement
	speed = {
		x: 0,
		y: 0,
		rotation: 0,
	};
	dragFactor = 0.97;
	maxAcceleration = 0.001;
	decelerateDistance = 2;
	targetAngle: number = Math.random() * (Math.PI / 4) - Math.PI / 8;
	rotationFactor = 0.1;

	// Bullets
	firesBullets = false;
	bulletFireOffset: number = Math.floor(Math.random() * 60);
	bulletFirePeriod?: number;

	// Exhaust
	exhaustColour: ColorRepresentation = 0xf505ed;
	exhaustParticlesPerSecond = 30;

	// Health
	hitboxRadius = 1;
	health = 1;

	// Explosions
	explosionEngine?: ExplosionEngine;
	getExplosionEngine = () => {
		if (!this.explosionEngine) {
			throw new Error('Explosion engine not set');
		}
		return this.explosionEngine;
	};

	constructor(mesh: THREE.Mesh) {
		super(mesh);
	}

	// optionally implement this furhter down the inheritance chain
	beforeAnimate = (frame: number) => {
		this.headTowardsSpaceship(frame);
	};

	headTowardsSpaceship = (frame: number) => {
		const ang = this.getAngleToSpaceship();
		const distance = this.getDistanceToSpaceship();
		if (ang === undefined || distance === undefined) return;
		if (distance > this.decelerateDistance) {
			const shortestAngleBetween = TrigonometryHelper.getShortestAngleBetween(
				this._object3d.rotation.z,
				ang + this.targetAngle,
			);
			this.speed.rotation = shortestAngleBetween * this.rotationFactor;
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
			const shortestAngleBetween = TrigonometryHelper.getShortestAngleBetween(this._object3d.rotation.z, ang);
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
		this.getExplosionEngine().addExplosion(
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

	// Must implement these methods further up the inheritance chain
	getGameObjectsToAdd: () => GameObjectsMap = () => {
		throw new Error('getGameObjectsToAdd not implemented');
	};
}
