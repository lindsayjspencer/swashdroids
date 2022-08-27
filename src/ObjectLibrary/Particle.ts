import * as THREE from 'three';
import SceneObject from './SceneObject';

export default class Particle extends SceneObject {
	lifetime: number;
	constructor(options: {
		color: THREE.ColorRepresentation;
		size: number;
		speed: { x: number; y: number };
		startingPosition: { x: number; y: number };
		opacity?: number;
		lifetime?: number;
	}) {
		const { color, size, speed, startingPosition, lifetime, opacity } = options;
		const material = new THREE.MeshLambertMaterial({
			side: THREE.DoubleSide,
			color: color,
			transparent: true,
			opacity: opacity || Math.random() * 0.5 + 0.5,
		});

		const geometry = new THREE.CircleGeometry(size, 12);
		const particle = new THREE.Mesh(geometry, material);

		particle.position.x = startingPosition.x;
		particle.position.y = startingPosition.y;

		super(particle);

		this.lifetime = lifetime || Math.random() * 2 + 1;

		this._disposableGeometries.push(geometry);
		this._disposableMaterials.push(material);
		this._meshes.push(particle);

		this.setAnimationSpeeds({
			position: speed,
		});
	}

	beforeAnimate = (frame: number) => {
		const mesh = this._object3d as THREE.Mesh;
		const materialProperty = mesh.material as THREE.Material | THREE.Material[];
		const material = Array.isArray(materialProperty) ? materialProperty[0] : materialProperty;
		material.opacity = Math.max(0, material.opacity - 0.01 / this.lifetime);
		if (material.opacity === 0) {
			this.setShouldRemove(true);
		}
	};
}
