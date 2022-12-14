export default class TrigonometryHelper {
	static getShortestAngleBetween = (a1: number, a2: number) => {
		const max = Math.PI * 2;
		const da = (a2 - a1) % max;
		return ((2 * da) % max) - da;
	};
}
