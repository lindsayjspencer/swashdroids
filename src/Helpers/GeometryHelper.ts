import * as THREE from 'three';

class GeometryHelper {
	createCustomGeometryFromPoints = (points: THREE.Vector3[], material: THREE.Material) => {
		const geometry = new THREE.BufferGeometry();
		geometry.setFromPoints(points);
		geometry.computeVertexNormals();
		return new THREE.Mesh(geometry, material);
	};
}

const geometryHelper = new GeometryHelper();
export default geometryHelper;
