const API_BASE = "/api";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.error ?? "Request failed", res.status, data?.details);
  }

  return data;
}

export const api = {
  register: (body) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/auth/me"),

  listWorkspaces: () => apiFetch("/workspaces"),
  createWorkspace: (body) => apiFetch("/workspaces", { method: "POST", body: JSON.stringify(body) }),
  listMembers: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/members`),
  addMember: (workspaceId, body) => apiFetch(`/workspaces/${workspaceId}/members`, { method: "POST", body: JSON.stringify(body) }),

  listProjects: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/projects`),
  createProject: (workspaceId, body) => apiFetch(`/workspaces/${workspaceId}/projects`, { method: "POST", body: JSON.stringify(body) }),

  listTasks: (workspaceId, projectId) => apiFetch(`/workspaces/${workspaceId}/projects/${projectId}/tasks`),
  createTask: (workspaceId, projectId, body) => apiFetch(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  updateTask: (workspaceId, projectId, taskId, body) => apiFetch(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }),

  askPulse: (workspaceId, message) => apiFetch(`/workspaces/${workspaceId}/pulse/chat`, { method: "POST", body: JSON.stringify({ message }) }),
  listProposals: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/pulse/proposals`),
  decideProposal: (workspaceId, proposalId, approve) => apiFetch(`/workspaces/${workspaceId}/pulse/proposals/${proposalId}/decide`, { method: "POST", body: JSON.stringify({ approve }) }),
};
