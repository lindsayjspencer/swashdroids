import * as THREE from 'three';

const cameraZPosition = 50;

export default class ThreeEngine {
	domElement: HTMLCanvasElement;
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
	}

	frame = 0;

	animate = () => {
		this.frame++;
		this.requestAnimationFrameId = requestAnimationFrame(this.animate);
		this.onAnimate?.(this.frame);
		this.renderer.render(this.scene, this.camera);
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

	addToScene = (object: THREE.Object3D) => {
		this.scene.add(object);
	};

	removeFromScene = (object: THREE.Object3D) => {
		this.scene.remove(object);
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
}
