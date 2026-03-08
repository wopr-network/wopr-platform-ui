import { apiFetch } from "./api";

// ---- Types ----

export type GpuStatus = "running" | "stopped" | "provisioning" | "error" | "rebooting";

export interface GpuNode {
  id: string;
  name: string;
  region: string;
  size: string;
  status: GpuStatus;
  ipAddress: string | null;
  /** GPU utilization 0–100 */
  utilization: number | null;
  /** VRAM used in MiB */
  memoryUsedMib: number | null;
  /** Total VRAM in MiB */
  memoryTotalMib: number | null;
  /** Temperature in °C */
  temperatureCelsius: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GpuRegion {
  slug: string;
  name: string;
  available: boolean;
}

export interface GpuSize {
  slug: string;
  name: string;
  vcpus: number;
  memoryMib: number;
  gpuCount: number;
  gpuModel: string;
  priceMonthly: number;
}

export interface ProvisionRequest {
  name: string;
  region: string;
  size: string;
}

// ---- API calls ----

export async function listGpuNodes(): Promise<GpuNode[]> {
  return apiFetch<GpuNode[]>("/admin/gpu");
}

export async function getGpuNode(id: string): Promise<GpuNode> {
  return apiFetch<GpuNode>(`/admin/gpu/${id}`);
}

export async function provisionGpuNode(req: ProvisionRequest): Promise<GpuNode> {
  return apiFetch<GpuNode>("/admin/gpu", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function destroyGpuNode(id: string): Promise<void> {
  await apiFetch<void>(`/admin/gpu/${id}`, { method: "DELETE" });
}

export async function rebootGpuNode(id: string): Promise<GpuNode> {
  return apiFetch<GpuNode>(`/admin/gpu/${id}/reboot`, { method: "POST" });
}

export async function listGpuRegions(): Promise<GpuRegion[]> {
  return apiFetch<GpuRegion[]>("/admin/gpu/regions");
}

export async function listGpuSizes(): Promise<GpuSize[]> {
  return apiFetch<GpuSize[]>("/admin/gpu/sizes");
}
