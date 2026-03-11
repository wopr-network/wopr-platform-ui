import { startMockApiServer } from "./mock-api-server";

export default async function globalSetup() {
	const server = await startMockApiServer(3001);
	// Store reference for teardown via globalThis
	(globalThis as Record<string, unknown>).__e2eMockServer = server;
	console.log("[e2e] Mock API server started on port 3001");
}
