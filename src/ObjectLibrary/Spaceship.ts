import * as THREE from 'three';
import SceneObject from './SceneObject';
import { GameKeyState } from 'Engines/GameEngine';
import Particle from './Particle';
import Bullet from './Bullet';
import ExplosionEngine from 'Engines/ExplosionEngine';
import { GameObjectsMap, GameObjectType } from 'Managers/SceneManager';

const maxAcceleration = 0.001;
const dragFactor = 0.99;
const rotationalDragFactor = 0.95;
const maxRotationSpeed = 0.04;
const rotationalAcceleration = 0.004;

// colours
const baseColour = 0x71bd31;
const outlineColour = 0xa6dc79;

export default class Spaceship extends SceneObject {
	acceleration = 0;
	speed = {
		x: 0,
		y: 0,
		rotation: 0,
	};
	getGameObjectsToAdd: () => GameObjectsMap;
	bulletAvailable = true;
	_maxVisibleDistance: number;
	isInvincible = false;
	bodyMaterial: THREE.MeshPhongMaterial;
	damage = 1;

	// Explosions
	explosionEngine?: ExplosionEngine;
	getExplosionEngine = () => {
		if (!this.explosionEngine) {
			throw new Error('Explosion engine not set');
		}
		return this.explosionEngine;
	};

	constructor(options: {
		size: number;
		getGameObjectsToAdd: () => GameObjectsMap;
		maxVisibleDistance: number;
		explosionEngine: ExplosionEngine;
	}) {
		const { size, getGameObjectsToAdd, explosionEngine, maxVisibleDistance } = options;
		const material = new THREE.MeshPhongMaterial({
			side: THREE.DoubleSide,
			color: baseColour,
			transparent: true,
			opacity: 1,
		});

		const shipShape = new THREE.Shape();
		shipShape.moveTo(0, 0.5 * size);
		shipShape.lineTo(0.35 * size, -0.5 * size);
		shipShape.lineTo(0, -0.25 * size);
		shipShape.lineTo(-0.35 * size, -0.5 * size);
		shipShape.lineTo(0, 0.5 * size);

		const shipGeometry = new THREE.ShapeGeometry(shipShape);
		const ship = new THREE.Mesh(shipGeometry, material);

		// outline
		const outline = new THREE.EdgesGeometry(shipGeometry);
		// thick lines
		const outlineMaterial = new THREE.LineBasicMaterial({ color: outlineColour });
		const outlineMesh = new THREE.LineSegments(outline, outlineMaterial);

		ship.add(outlineMesh);

		ship.position.x = 0;
		ship.position.y = 0;
		ship.position.z = 0;

		super(ship);

		this._disposableGeometries.push(shipGeometry, outline);
		this._disposableMaterials.push(material, outlineMaterial);
		this._meshes.push(ship);

		this.bodyMaterial = material;

		this.getGameObjectsToAdd = getGameObjectsToAdd;
		this.explosionEngine = explosionEngine;
		this._maxVisibleDistance = maxVisibleDistance;
	}

	setMaxVisibleDistance = (distance: number) => {
		this._maxVisibleDistance = distance;
	};

	getMaxVisibleDistance = () => {
		return this._maxVisibleDistance;
	};

	modifySpeed = () => {
		this.speed.x += maxAcceleration * Math.cos(this._object3d.rotation.z + Math.PI / 2);
		this.speed.y += maxAcceleration * Math.sin(this._object3d.rotation.z + Math.PI / 2);
	};

	applyDrag = (modifier: number) => {
		this.speed.x *= dragFactor * modifier;
		this.speed.y *= dragFactor * modifier;
	};

	applyRotationalDrag = (modifier: number) => {
		this.speed.rotation *= rotationalDragFactor * modifier;
	};

	beforeAnimate = (frame: number, keyState: GameKeyState) => {
		if (this.isInvincible) {
			if (frame % 5 === 0) {
				this.bodyMaterial.opacity = this.bodyMaterial.opacity === 1 ? 0.5 : 1;
			}
		} else {
			this.bodyMaterial.opacity = 1;
		}
		if (keyState.ArrowUp) {
			this.modifySpeed();
			this.applyDrag(1);
			// exhaust particles
			if (frame % 2 === 0) {
				const randomRotationAngle = -this._object3d.rotation.z - Math.PI + Math.random() * 0.3 - 0.15;
				const particle = new Particle({
					color: 0x71bd31,
					size: 0.03,
					speed: {
						x: Math.sin(randomRotationAngle) / (Math.random() * 30 + 25),
						y: Math.cos(randomRotationAngle) / (Math.random() * 30 + 25),
					},
					startingPosition: {
						x:
							this._object3d.position.x +
							(Math.random() * 0.08 - 0.04) +
							Math.sin(randomRotationAngle) / 8,
						y:
							this._object3d.position.y +
							(Math.random() * 0.08 - 0.04) +
							Math.cos(randomRotationAngle) / 8,
					},
					lifetime: Math.random() * 1,
				});
				this.getGameObjectsToAdd()[GameObjectType.FadingArtifact].push(particle);
			}
		}
		if (keyState.ArrowLeft) {
			this.speed.rotation += rotationalAcceleration;
		}
		if (keyState.ArrowRight) {
			this.speed.rotation -= rotationalAcceleration;
		}
		if (!keyState.ArrowRight && !keyState.ArrowLeft) {
			this.applyRotationalDrag(1);
		}
		// apply min max to rotation speeds
		this.speed.rotation = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, this.speed.rotation));
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

	fireBullet = () => {
		if (!this.bulletAvailable) return;
		this.bulletAvailable = false;
		const rotationAngle = -this._object3d.rotation.z;
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
			this._maxVisibleDistance,
		);
		this.getGameObjectsToAdd()[GameObjectType.SpaceshipBullet].push(bullet);
	};

	checkCollisionWithBullet = (bullet: Bullet) => {
		if (this.isInvincible) return;
		const distance = bullet.getDistanceToSpaceship();
		if (distance !== undefined && distance < 0.3) {
			const impactAngle = Math.atan2(
				bullet._object3d.position.y - this._object3d.position.y,
				bullet._object3d.position.x - this._object3d.position.x,
			);
			const travelAngle = Math.atan2(bullet._animationSpeeds.position.x, bullet._animationSpeeds.position.y);
			this.getExplosionEngine().addExplosion(
				{
					angle: () => impactAngle + (Math.random() * 0.5 - 0.25),
					position: {
						x: bullet._object3d.position.x,
						y: bullet._object3d.position.y,
					},
					particles: {
						amount: 12,
						colour: 0xfc0303,
					},
				},
				{
					angle: () => travelAngle + (Math.random() * 0.2 - 0.1),
					position: {
						x: bullet._object3d.position.x,
						y: bullet._object3d.position.y,
					},
					particles: {
						amount: 8,
						colour: 0x9c0202,
					},
				},
				{
					position: {
						x: this._object3d.position.x,
						y: this._object3d.position.y,
					},
					particles: {
						amount: 6,
						colour: 0x000000,
					},
				},
			);
			bullet.setShouldRemove(true);
			this.handleCollision();
		}
	};

	handleCollision = () => {
		this.isInvincible = true;
		setTimeout(() => {
			this.isInvincible = false;
		}, 2000);
	};
}
