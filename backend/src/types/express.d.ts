import "express";

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      name: string;
      email: string;
    }

    interface Membership {
      id: string;
      workspaceId: string;
      userId: string;
      role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
      createdAt: Date;
    }

    interface Request {
      user?: AuthUser;
      membership?: Membership;
    }
  }
}

export {};
