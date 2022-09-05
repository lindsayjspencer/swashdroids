import * as THREE from 'three';
import LightEnemyASrc from 'ObjectLibrary/JSON/LightEnemyA.json';

class ObjectMeshCreator {
	objectLoader = new THREE.ObjectLoader();

	gatherGeometriesAndMaterials = (object: THREE.Object3D) => {
		const geometries: THREE.BufferGeometry[] = [];
		const materials: THREE.Material[] = [];

		object.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				const geometry = child.geometry;
				if (geometry instanceof THREE.BufferGeometry) {
					geometries.push(geometry);
				}
				const material = child.material;
				if (material instanceof THREE.Material) {
					materials.push(material);
				}
			}
		});

		return { geometries, materials };
	};

	getCombinedBoundingBox = (object: THREE.Mesh) => {
		const result = new THREE.Box3();
		object.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.geometry.computeBoundingBox();
				result.union(child.geometry.boundingBox);
			}
		});

		return result;
	};

	createLightEnemyA = () => {
		const mesh = this.objectLoader.parse(LightEnemyASrc) as THREE.Mesh;
		return {
			mesh,
			...this.gatherGeometriesAndMaterials(mesh),
			boundingBox: this.getCombinedBoundingBox(mesh),
		};
	};
}

const objectMeshCreator = new ObjectMeshCreator();
export default objectMeshCreator;
