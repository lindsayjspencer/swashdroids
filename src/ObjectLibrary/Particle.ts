import * as THREE from 'three';
import GameObject from './GameObject';

export default class Particle extends GameObject {
	removeFromScene: () => void;
	constructor(
		size: number,
		speed: { x: number; y: number },
		startingPosition: { x: number; y: number },
		removeFromScene: () => void,
	) {
		const material = new THREE.MeshLambertMaterial({
			side: THREE.DoubleSide,
			color: 0x71bd31,
			transparent: true,
			opacity: Math.random() * 0.5 + 0.5,
		});

		const geometry = new THREE.CircleGeometry(size, 12);
		const particle = new THREE.Mesh(geometry, material);

		particle.position.x = startingPosition.x;
		particle.position.y = startingPosition.y;

		super(particle);

		this.removeFromScene = removeFromScene;
		this.setAnimationSpeeds({
			position: speed,
		});
	}

	beforeAnimate = (frame: number) => {
		const mesh = this._object3d as THREE.Mesh;
		const materialProperty = mesh.material as THREE.Material | THREE.Material[];
		const material = Array.isArray(materialProperty) ? materialProperty[0] : materialProperty;
		material.opacity = Math.max(0, material.opacity - 0.005);
		if (material.opacity === 0) {
			this.removeFromScene();
		}
	};
}
