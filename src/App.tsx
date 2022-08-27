import React, { useEffect, useMemo, useRef } from 'react';
import GameEngine from 'Engines/GameEngine';
import ThreeEngine from 'Engines/ThreeEngine';

const calculateCanvasSize = () => {
	const width = window.innerWidth;
	const height = window.innerHeight;
	return { width, height };
};

function App() {
	const mountRef = useRef<HTMLDivElement>(null);

	const threeEngine = useMemo(() => {
		const { width, height } = calculateCanvasSize();
		console.log('create new three engine');
		return new ThreeEngine(width, height);
	}, []);

	const gameEngine = useMemo(() => new GameEngine(threeEngine), [threeEngine]);

	useEffect(() => {
		const mountRefCurrent = mountRef.current;
		if (mountRefCurrent === null) return;
		const canvas = threeEngine.getCanvasElement();
		mountRefCurrent.appendChild(canvas);
		threeEngine.initialise();
		return () => {
			mountRefCurrent.removeChild(canvas);
			threeEngine.dispose();
		};
	}, [mountRef, threeEngine]);

	useEffect(() => {
		const resize = () => {
			const { width, height } = calculateCanvasSize();
			threeEngine.setCanvasSize(width, height);
			const canvas = threeEngine.getCanvasElement();
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			gameEngine.recalculateVisibleDistance();
		};
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	}, [threeEngine, gameEngine]);

	// key listeners
	useEffect(() => {
		const keyDown = (e: KeyboardEvent) => {
			gameEngine.onKeyDown(e);
		};
		const keyUp = (e: KeyboardEvent) => {
			gameEngine.onKeyUp(e);
		};
		window.addEventListener('keydown', keyDown);
		window.addEventListener('keyup', keyUp);
		return () => {
			window.removeEventListener('keydown', keyDown);
			window.removeEventListener('keyup', keyUp);
		};
	}, [gameEngine]);

	useEffect(() => {
		gameEngine.initialise();
		return () => {
			gameEngine.dispose();
		};
	}, [gameEngine]);

	return <div ref={mountRef} />;
}

export default App;
