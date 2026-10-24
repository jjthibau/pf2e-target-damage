# PF2e Apply Damage to Target

Adds **Apply to Target** beside the normal PF2e damage controls. The GM sees the recorded target's name and portrait and applies damage with one click, without selecting its token.

Uses the target stored on the damage roll. Damage rolled from an attack chat card retains that attack's target through PF2e's native workflow, even after the player changes targets. Damage rolled directly from a sheet uses the target PF2e records at that time. Missing targets are never guessed; the button is disabled with an explanation. Only GMs receive the additional control.

The button applies the rolled damage once at its existing normal/critical value. Standard half/double/healing/Shield Block controls remain available. PF2e handles contextual effects, weaknesses, resistances, immunities, temporary HP, persistent damage, damage receipts and Undo. A brief in-flight guard prevents concurrent clicks on the same roll. Deliberate later applications remain possible just like native damage buttons.

![GM damage card](https://raw.githubusercontent.com/jjthibau/pf2e-target-damage/main/docs/preview.png)

## Installation

In Foundry Setup, open **Add-on Modules → Install Module** and paste this manifest URL:

```text
https://github.com/jjthibau/pf2e-target-damage/releases/latest/download/module.json
```

Enable **PF2e Apply Damage to Target** in your world's Manage Modules window. No additional configuration or dependencies are required. Reload clients after installation or updates.

Verified with Foundry **14.369** / PF2e **8.6.0**. See [testing](docs/testing.md) for coverage and limits. Report problems through [GitHub Issues](https://github.com/jjthibau/pf2e-target-damage/issues), including your versions.

## Integration

PF2e's native damage action does not accept an explicit recipient. This module supplies the recorded token through a synchronously scoped `getActiveTokens` override while invoking that action. The method is restored immediately, before awaiting damage processing; GM selection and targeting are never changed. This small version-sensitive adapter is covered by native integration tests and must be checked when PF2e changes its damage action.

No automation on misses, damage rolling, area targeting, hidden-name disclosure to players, encounter scans, toolbox dependencies or automatic HP changes before a GM clicks.

## Development

Node 24 and Python 3. Run `npm test` for syntax and release-package validation. `npm run build` creates the eight-file package and checksums in `dist/`. Licensed integration testing is separate; see [testing](docs/testing.md).

Released under the [MIT License](LICENSE). Independent community module; not an official Paizo or Foundry VTT product.
