import { Router } from "express";
import { requireWorkspaceContributor, requireWorkspaceManager, requireWorkspaceMember } from "../../middlewares/rbac.middleware.js";
import { pulsePerUserLimiter, pulsePerIpLimiter } from "../../middlewares/rateLimit.middleware.js";
import { env } from "../../config/env.js";
import { askPulseSchema, decideProposalSchema, listProposalsQuerySchema } from "./schemas.js";
import { askPulse, listProposals, decideProposal } from "./service.js";

const router = Router({ mergeParams: true });

router.get("/status", requireWorkspaceMember, async (_req, res, next) => {
  try {
    res.json({ enabled: Boolean(env.AI_ENABLED && env.GROQ_API_KEY) });
  } catch (err) {
    next(err);
  }
});

router.post("/chat", requireWorkspaceContributor, pulsePerIpLimiter, pulsePerUserLimiter, async (req, res, next) => {
  try {
    const { message } = askPulseSchema.parse(req.body);
    const reply = await askPulse((req.params.workspaceId as string), req.user!.id, message);
    res.json(reply);
  } catch (err) {
    next(err);
  }
});

router.get("/proposals", requireWorkspaceMember, async (req, res, next) => {
  try {
    const query = listProposalsQuerySchema.parse(req.query);
    const result = await listProposals((req.params.workspaceId as string), query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/proposals/:proposalId/decide", requireWorkspaceManager, async (req, res, next) => {
  try {
    const { approve } = decideProposalSchema.parse(req.body);
    const proposal = await decideProposal(
      (req.params.workspaceId as string),
      (req.params.proposalId as string),
      req.user!.id,
      req.membership!.role,
      approve,
    );
    res.json({ proposal });
  } catch (err) {
    next(err);
  }
});

export default router;
