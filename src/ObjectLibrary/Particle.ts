import * as THREE from 'three';
import CanvasObject from './CanvasObject';

export default class Particle extends CanvasObject {
	constructor(size: number, speed: { x: number; y: number }, startingPosition: { x: number; y: number }) {
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
			this.setShouldRemove(true);
		}
	};
}
