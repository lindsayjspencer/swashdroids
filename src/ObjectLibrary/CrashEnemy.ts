import * as THREE from 'three';
import GameObject from './GameObject';
import { PartialAnimationSpeeds } from './SceneObject';

const baseSize = 0.15;
const baseSpeed = 0.015;

const material = new THREE.MeshLambertMaterial({
	color: 0x222222,
});

const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

export default class CrashEnemy extends GameObject {
	constructor(
		options: {
			animationSpeeds?: PartialAnimationSpeeds;
			startingPosition?: { x: number; y: number };
			startingRotation?: number;
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

	updateMovement = () => {
		const ang = this.getAngleToSpaceship();
		if (ang === undefined) return;
		this.setAnimationSpeeds({
			position: {
				x: Math.cos(ang + Math.PI) * baseSpeed,
				y: Math.sin(ang + Math.PI) * baseSpeed,
			},
		});
	};

	beforeAnimate = (frame: number) => {
		if (frame % 60 === 0) {
			this.updateMovement();
		}
		const ang = this.getAngleToSpaceship();
		if (ang !== undefined) {
			this._object3d.rotation.z = ang - Math.PI / 4;
		}
	};
}
