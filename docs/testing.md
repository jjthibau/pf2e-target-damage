# Testing and compatibility

Verified on Foundry 14.369 / PF2e 8.6.0 in an independent synthetic world with separate GM/player browsers. No campaign content is distributed.

24 native gameplay/UI checks cover GM-only rendering, layout, recorded target, resistance, weakness, immunity, mixed pools, already doubled critical damage, temporary HP, duplicate dispatch, selection/target preservation, receipts/Undo, missing/deleted targets and unlinked actors. A player attacks A, switches to B and rolls damage from the original attack card; the GM button damages A. Browser refresh preserves the target. Native manual controls still damage selected B. Four more checks cover world identity and source parity.

Evidence combines 27 core checks and a focused manual-control follow-up on matching runtime hashes; duplicate infrastructure checks count once. The core harness's last locator encountered a duplicate notification; a focused follow-up selected the intended control and passed. Earlier fixture/selector failures were retained. Final reports had zero page/console errors and the isolated server was stopped.

CI checks syntax, manifest/version/tag/links and archive integrity. It does not run licensed integration tests. Before claiming another PF2e version, repeat recipient capture, changed-target attack cards, IWR, Undo, selection and permissions checks. Full companion-module combinations and chat popouts are not yet tested. Multi-target area damage remains handled by normal controls.
