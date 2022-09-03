import * as THREE from 'three';
import SceneObject from './SceneObject';

export default class FadingArtifact extends SceneObject {
	lifetime: number;
	fadableMaterials: THREE.Material[];
	constructor(options: { lifetime?: number; mesh: THREE.Mesh; fadableMaterials: THREE.Material[] }) {
		const { lifetime, mesh, fadableMaterials } = options;
		super(mesh);
		this.fadableMaterials = fadableMaterials;
		this.lifetime = lifetime || Math.random() * 2 + 1;
	}

	fade = (frame: number) => {
		for (const fadableMaterial of this.fadableMaterials) {
			fadableMaterial.opacity = Math.max(0, fadableMaterial.opacity - 0.01 / this.lifetime);
		}
		// if all materials are transparent, remove the object
		if (this.fadableMaterials.every((material) => material.opacity === 0)) {
			this.setShouldRemove(true);
		}
	};
}
