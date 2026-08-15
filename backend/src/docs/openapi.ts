import { createDocument } from "zod-openapi";
import type { ZodTypeAny } from "zod";
import { zodToSchema } from "./zod-to-schema.js";
import { registerSchema, loginSchema } from "../domains/auth/schemas.js";
import { createWorkspaceSchema } from "../domains/workspaces/schemas.js";
import { addMemberSchema } from "../domains/members/schemas.js";
import { createInviteSchema } from "../domains/invites/schemas.js";
import { createProjectSchema } from "../domains/projects/schemas.js";
import { createTaskSchema, updateTaskSchema } from "../domains/tasks/schemas.js";
import { createCommentSchema } from "../domains/comments/schemas.js";
import { createLabelSchema } from "../domains/labels/schemas.js";
import { askPulseSchema, decideProposalSchema } from "../domains/assistant/schemas.js";

const jsonBody = (schema: ZodTypeAny) => ({
  content: { "application/json": { schema: zodToSchema(schema) } },
});

export const openapiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Workwise API",
    version: "1.0.0",
    description: "Workspaces, projects, tasks, and the Pulse AI assistant.",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        requestBody: jsonBody(registerSchema),
        responses: { "201": { description: "User created" } },
      },
    },
    "/auth/login": {
      post: {
        summary: "Log in",
        requestBody: jsonBody(loginSchema),
        responses: { "200": { description: "Logged in" } },
      },
    },
    "/auth/demo": {
      post: {
        summary: "Log in as a demo guest account",
        responses: { "200": { description: "Logged in as guest" } },
      },
    },
    "/auth/logout": {
      post: { summary: "Log out", responses: { "204": { description: "Logged out" } } },
    },
    "/auth/me": {
      get: { summary: "Get the current user", responses: { "200": { description: "Current user" } } },
    },
    "/workspaces": {
      get: { summary: "List my workspaces", responses: { "200": { description: "Workspaces" } } },
      post: {
        summary: "Create a workspace",
        requestBody: jsonBody(createWorkspaceSchema),
        responses: { "201": { description: "Workspace created" } },
      },
    },
    "/workspaces/{workspaceId}": {
      get: { summary: "Get a workspace", responses: { "200": { description: "Workspace" } } },
      patch: { summary: "Update a workspace", responses: { "200": { description: "Workspace updated" } } },
      delete: { summary: "Delete a workspace", responses: { "204": { description: "Deleted" } } },
    },
    "/workspaces/{workspaceId}/transfer-owner": {
      patch: { summary: "Transfer workspace ownership", responses: { "200": { description: "Ownership transferred" } } },
    },
    "/workspaces/{workspaceId}/members": {
      get: { summary: "List members", responses: { "200": { description: "Members" } } },
      post: {
        summary: "Add a member",
        requestBody: jsonBody(addMemberSchema),
        responses: { "201": { description: "Member added" } },
      },
    },
    "/workspaces/{workspaceId}/invites": {
      get: { summary: "List pending invites", responses: { "200": { description: "Invites" } } },
      post: {
        summary: "Create an invite",
        requestBody: jsonBody(createInviteSchema),
        responses: { "201": { description: "Invite created" } },
      },
    },
    "/invites/{token}/accept": {
      post: { summary: "Accept an invite", responses: { "200": { description: "Accepted" } } },
    },
    "/invites/{token}/decline": {
      post: { summary: "Decline an invite", responses: { "200": { description: "Declined" } } },
    },
    "/workspaces/{workspaceId}/projects": {
      get: { summary: "List projects", responses: { "200": { description: "Projects" } } },
      post: {
        summary: "Create a project",
        requestBody: jsonBody(createProjectSchema),
        responses: { "201": { description: "Project created" } },
      },
    },
    "/workspaces/{workspaceId}/projects/{projectId}/tasks": {
      get: { summary: "List tasks", responses: { "200": { description: "Tasks" } } },
      post: {
        summary: "Create a task",
        requestBody: jsonBody(createTaskSchema),
        responses: { "201": { description: "Task created" } },
      },
    },
    "/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}": {
      patch: {
        summary: "Update a task",
        requestBody: jsonBody(updateTaskSchema),
        responses: { "200": { description: "Task updated" } },
      },
      delete: { summary: "Delete a task", responses: { "204": { description: "Deleted" } } },
    },
    "/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}/comments": {
      get: { summary: "List comments", responses: { "200": { description: "Comments" } } },
      post: {
        summary: "Add a comment",
        requestBody: jsonBody(createCommentSchema),
        responses: { "201": { description: "Comment created" } },
      },
    },
    "/workspaces/{workspaceId}/labels": {
      get: { summary: "List labels", responses: { "200": { description: "Labels" } } },
      post: {
        summary: "Create a label",
        requestBody: jsonBody(createLabelSchema),
        responses: { "201": { description: "Label created" } },
      },
    },
    "/workspaces/{workspaceId}/activity": {
      get: { summary: "List audit log entries", responses: { "200": { description: "Activity" } } },
    },
    "/notifications": {
      get: { summary: "List my notifications", responses: { "200": { description: "Notifications" } } },
    },
    "/notifications/{id}/read": {
      patch: { summary: "Mark a notification as read", responses: { "200": { description: "Notification marked read" } } },
    },
    "/notifications/read-all": {
      patch: { summary: "Mark all notifications as read", responses: { "204": { description: "Marked all read" } } },
    },
    "/workspaces/{workspaceId}/pulse/chat": {
      post: {
        summary: "Ask Pulse",
        requestBody: jsonBody(askPulseSchema),
        responses: { "200": { description: "Pulse reply" } },
      },
    },
    "/workspaces/{workspaceId}/pulse/proposals": {
      get: { summary: "List AI action proposals", responses: { "200": { description: "Proposals" } } },
    },
    "/workspaces/{workspaceId}/pulse/proposals/{proposalId}/decide": {
      post: {
        summary: "Approve or reject a proposal",
        requestBody: jsonBody(decideProposalSchema),
        responses: { "200": { description: "Decision recorded" } },
      },
    },
  },
});
