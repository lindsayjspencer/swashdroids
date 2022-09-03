import { GameObjectsMap, GameObjectType } from 'Engines/GameEngine';
import * as THREE from 'three';
import Particle from './Particle';
import GameObject from './GameObject';
import { PartialAnimationSpeeds } from './SceneObject';
import Bullet from './Bullet';

const baseSize = 0.15;
const baseSpeed = 0.015;

const maxAcceleration = 0.001;
const dragFactor = 0.97;
const rotationalDragFactor = 0.95;
const maxRotationSpeed = 0.04;
const rotationalAcceleration = 0.004;

const material = new THREE.MeshLambertMaterial({
	color: 0x222222,
});

const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

export default class CrashEnemy extends GameObject {
	acceleration = 0;
	speed = {
		x: 0,
		y: 0,
		rotation: 0,
	};
	getGameObjectsToAdd: () => GameObjectsMap;

	constructor(
		options: {
			animationSpeeds?: PartialAnimationSpeeds;
			startingPosition?: { x: number; y: number };
			startingRotation?: number;
			getGameObjectsToAdd: () => GameObjectsMap;
		},
		size: number,
		maxVisibleDistance: number,
	) {
		const calculatedSize = baseSize * size;
		const animationSpeeds = options.animationSpeeds || ({} as PartialAnimationSpeeds);
		const startingPosition = options.startingPosition || { x: 0, y: 0 };
		const startingRotation = options.startingRotation || 0;
		// create enemy shape
		const geometry = new THREE.PlaneGeometry(calculatedSize, calculatedSize);

		const enemy = new THREE.Mesh(geometry, material);

		enemy.position.x = startingPosition.x;
		enemy.position.y = startingPosition.y;

		enemy.rotation.z = startingRotation;

		super(enemy);

		this.setMaxVisibleDistance(maxVisibleDistance);

		this.getGameObjectsToAdd = options.getGameObjectsToAdd;

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
		const ang = this.getAngleToSpaceship();
		const distance = this.getDistanceToSpaceship();
		if (ang === undefined || distance === undefined) return;
		this._object3d.rotation.z = ang;
		if (distance > 2) {
			// modify speed
			this.speed.x += maxAcceleration * Math.cos(this._object3d.rotation.z - Math.PI);
			this.speed.y += maxAcceleration * Math.sin(this._object3d.rotation.z - Math.PI);
			// apply drag
			this.speed.x *= dragFactor;
			this.speed.y *= dragFactor;
			// exhaust particles
			if (frame % 2 === 0) {
				this.addExhaustParticle();
			}
		}
		if (distance < 3 && frame % 60 === 0) {
			this.fireBullet();
		}
		this.setAnimationSpeeds({
			position: {
				x: this.speed.x,
				y: this.speed.y,
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
				x: this._object3d.position.x + (Math.random() * 0.08 - 0.04) + Math.sin(randomRotationAngle) / 8,
				y: this._object3d.position.y + (Math.random() * 0.08 - 0.04) + Math.cos(randomRotationAngle) / 8,
			},
			lifetime: Math.random() * 1,
		});
		this.getGameObjectsToAdd()[GameObjectType.ExhaustParticle].push(particle);
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
}
