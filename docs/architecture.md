# Architecture

GM-visible native damage cards receive a control during renderChatMessageHTML. It resolves `flags.pf2e.context.target.token` to an exact Scene TokenDocument. Current selection and targeting never supply a fallback. PF2e already carries the original attack-card target into strike damage; no message correlation is required.

The native damage action reads recipients synchronously through `game.user.getActiveTokens()`. The adapter supplies the recorded token for that call and immediately restores the original property descriptor in finally, before awaiting processing. PF2e handles contextual clones, ephemeral effects, IWR, HP, receipts and Undo. Cards with native actorIsTarget routing are excluded.

Changes to native recipient lookup or its first asynchronous boundary require revalidation. An in-flight message/roll key guards concurrent dispatch without blocking later intentional applications. Original damage controls remain unchanged.
