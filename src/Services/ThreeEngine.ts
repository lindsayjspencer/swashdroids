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

	setOnAnimate = (onAnimate: (frame: number) => void) => {
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

	initialise = () => {
		this.isInitialised = true;
		this.camera.position.z = cameraZPosition;
		let frame = 0;
		const animate = () => {
			frame++;
			this.requestAnimationFrameId = requestAnimationFrame(animate);
			this.onAnimate?.(frame);
			this.renderer.render(this.scene, this.camera);
		};
		animate();
		console.log('ThreeEngine initialised');
	};

	dispose = () => {
		this.renderer.dispose();
		console.log('ThreeEngine disposed');
		this.isInitialised = false;
		this.requestAnimationFrameId && window.cancelAnimationFrame(this.requestAnimationFrameId);
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
	};
}
