import * as THREE from 'three';
import GameObject from './GameObject';

export default class Bullet extends GameObject {
	constructor(size: number, speed: { x: number; y: number }, startingPosition: { x: number; y: number }) {
		const material = new THREE.MeshLambertMaterial({
			side: THREE.DoubleSide,
			color: 0x000000,
		});

		const geometry = new THREE.CircleGeometry(size, 12);
		const particle = new THREE.Mesh(geometry, material);

		particle.position.x = startingPosition.x;
		particle.position.y = startingPosition.y;

		super(particle);

		this.setAnimationSpeeds({
			position: speed,
		});
	}

	beforeAnimate = (frame: number) => {
		const distanceToSpacehip = this.getDistanceToSpaceship();
		if (!distanceToSpacehip) return;
		if (distanceToSpacehip > 6) {
			this.setShouldRemove(true);
		}
	};
}
