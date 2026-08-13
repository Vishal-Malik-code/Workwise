import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadMembership, requireRole } from "../middleware/rbac.js";
import { chat, listProposals, decideProposal } from "../controllers/pulse.controller.js";

const router = Router({ mergeParams: true });

router.use(requireAuth, loadMembership);

router.post("/chat", requireRole("MEMBER"), chat);
router.get("/proposals", listProposals);
router.post("/proposals/:proposalId/decide", requireRole("MANAGER"), decideProposal);

export default router;
