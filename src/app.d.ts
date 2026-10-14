declare global {
	namespace App {
		interface Locals {
			role: 'student' | 'parent' | null;
		}
	}
}

export {};
