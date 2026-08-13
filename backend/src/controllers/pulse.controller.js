import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { askPulseSchema } from "../validators/pulse.js";
import { askPulse, reviewProposal } from "../services/pulse.service.js";

export async function chat(req, res, next) {
  try {
    const { message } = askPulseSchema.parse(req.body);
    const reply = await askPulse({ workspaceId: req.params.workspaceId, userId: req.user.id, message });
    res.json(reply);
  } catch (err) {
    next(err);
  }
}

export async function listProposals(req, res, next) {
  try {
    const rows = await db
      .select()
      .from(schema.aiActionProposals)
      .where(eq(schema.aiActionProposals.workspaceId, req.params.workspaceId));

    res.json({ proposals: rows });
  } catch (err) {
    next(err);
  }
}

export async function decideProposal(req, res, next) {
  try {
    const { workspaceId, proposalId } = req.params;
    const approve = req.body.approve === true;

    const [proposal] = await db
      .select()
      .from(schema.aiActionProposals)
      .where(and(eq(schema.aiActionProposals.id, proposalId), eq(schema.aiActionProposals.workspaceId, workspaceId)))
      .limit(1);

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    if (proposal.status !== "PENDING") {
      return res.status(409).json({ error: "Proposal already reviewed" });
    }

    const updated = await reviewProposal({ proposal, reviewerId: req.user.id, approve });
    res.json({ proposal: updated });
  } catch (err) {
    next(err);
  }
}
