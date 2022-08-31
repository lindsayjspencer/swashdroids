import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

const cameraZPosition = 50;

export default class ThreeEngine {
	domElement: HTMLCanvasElement;
	statsDomElement: HTMLDivElement;
	stats: Stats;
	camera: THREE.PerspectiveCamera;
	scene: THREE.Scene;
	renderer: THREE.WebGLRenderer;
	onAnimate?: (frame: number) => void;
	isInitialised = false;
	requestAnimationFrameId?: number;

	setOnAnimate = (onAnimate: ((frame: number) => void) | undefined) => {
		this.onAnimate = onAnimate;
	};

	getCanvasElement = () => {
		return this.domElement;
	};

	getStatsDomElement = () => {
		return this.statsDomElement;
	};

	constructor(width: number, height: number) {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(10, width / height, 0.1, 1000);
		this.renderer = new THREE.WebGLRenderer();

		// create ambient light
		const ambientLight = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(ambientLight);

		//create directional light
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(1, 1, 1);
		this.scene.add(directionalLight);

		// set background color
		this.renderer.setClearColor(0xffffff, 1);

		this.domElement = this.renderer.domElement;
		this.renderer.setSize(width, height);

		this.stats = Stats();
		this.statsDomElement = this.stats.dom;
	}

	frame = 0;

	animate = () => {
		this.frame++;
		this.requestAnimationFrameId = requestAnimationFrame(this.animate);
		this.onAnimate?.(this.frame);
		this.renderer.render(this.scene, this.camera);
		this.stats.update();
	};

	initialise = () => {
		this.isInitialised = true;
		this.camera.position.z = cameraZPosition;
		this.animate();
		console.log('ThreeEngine initialised');
	};

	dispose = () => {
		this.renderer.dispose();
		console.log('ThreeEngine disposed');
		this.isInitialised = false;
		if (this.requestAnimationFrameId !== undefined) {
			cancelAnimationFrame(this.requestAnimationFrameId);
		}
	};

	setCameraAspectRation = (width: number, height: number) => {
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	};

	setCanvasSize = (width: number, height: number) => {
		this.setCameraAspectRation(width, height);
		this.renderer.setSize(width, height);
	};

	addToScene = (objects: THREE.Object3D[]) => {
		this.scene.add(...objects);
	};

	removeFromScene = (objects: THREE.Object3D[]) => {
		this.scene.remove(...objects);
	};

	setCameraPosition = (x: number, y: number) => {
		this.camera.position.set(x, y, cameraZPosition);
		// update
		this.camera.updateProjectionMatrix();
	};

	calculateScreenCoordinates = (object: THREE.Object3D) => {
		const vector = new THREE.Vector3();
		vector.setFromMatrixPosition(object.matrixWorld);
		vector.project(this.camera);
		vector.x = ((vector.x + 1) * this.domElement.width) / 2;
		vector.y = (-(vector.y - 1) * this.domElement.height) / 2;
		return vector;
	};

	calculateAngleBetweenObjects = (object1: THREE.Object3D, object2: THREE.Object3D) => {
		const vector1 = new THREE.Vector3();
		object1.updateMatrixWorld();
		vector1.setFromMatrixPosition(object1.matrixWorld);
		const vector2 = new THREE.Vector3();
		object2.updateMatrixWorld();
		vector2.setFromMatrixPosition(object2.matrixWorld);
		return vector1.angleTo(vector2);
	};

	calculateDistanceBetweenObjects = (object1: THREE.Object3D, object2: THREE.Object3D) => {
		const vector1 = new THREE.Vector3();
		object1.updateMatrixWorld();
		vector1.setFromMatrixPosition(object1.matrixWorld);
		const vector2 = new THREE.Vector3();
		object2.updateMatrixWorld();
		vector2.setFromMatrixPosition(object2.matrixWorld);
		const distance = vector1.distanceTo(vector2);
		return distance;
	};

	visibleHeightAtZDepth = (depth: number, camera: THREE.PerspectiveCamera) => {
		// compensate for cameras not positioned at z=0
		const cameraOffset = camera.position.z;
		if (depth < cameraOffset) depth -= cameraOffset;
		else depth += cameraOffset;

		// vertical fov in radians
		const vFOV = (camera.fov * Math.PI) / 180;

		// Math.abs to ensure the result is always positive
		return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
	};

	visibleWidthAtZDepth = (depth: number, camera: THREE.PerspectiveCamera) => {
		const height = this.visibleHeightAtZDepth(depth, camera);
		return height * camera.aspect;
	};

	getVisibleHeightAndWidth = () => {
		const height = this.visibleHeightAtZDepth(cameraZPosition, this.camera);
		const width = this.visibleWidthAtZDepth(cameraZPosition, this.camera);
		console.log('Canvas dimensions', height, width);
		return {
			height,
			width,
		};
	};
}
