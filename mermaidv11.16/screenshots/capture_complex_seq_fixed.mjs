import { chromium } from 'playwright';
import fs from 'fs';

const mermaidCode = `sequenceDiagram
    autonumber
    actor Player
    participant SM as SelectionManager
    participant HM as HighlightManager
    participant TC as TouchCounter
    participant LM as LevelManager
    participant DC as IDestroyableComponent
    participant Item
    participant Field
    participant Tgt as TargetSystem

    rect rgb(245, 245, 220)
    Note over Player,TC: Stage 1 — Finger DOWN
    Player->>SM: touch.phase = Began
    SM->>SM: OnStartSelection() [:113]
    SM->>HM: OverlapPoint → GetNearMatches [:148]
    HM-->>SM: preSelectedList (eligible same-color)
    SM->>TC: spawn TouchCounter, SetColor [:137]
    SM->>SM: itemMatching, selectedColor set
    end

    rect rgb(220, 240, 220)
    Note over Player,Tgt: Stage 2 — DRAG (repeats each frame)
    Player->>SM: touch.phase = Moved
    SM->>SM: LinecastAll(start→direct, "Item") [:74]
    loop each collider hit
        SM->>SM: OnNewSelectedForBlast(highlightable) [:161]
        SM->>TC: NextType(count), UpdateCount
        SM->>SM: grow highlightedList
        Note right of SM: tails into OnEndSelection() [:190]<br/>every frame (no move spent)
    end
    end

    rect rgb(230, 220, 240)
    Note over Player,Tgt: Stage 3 — Finger UP (commit)
    Player->>SM: touch.phase = Ended
    SM->>SM: OnEndSelection() [:193]
    SM->>LM: destroyAnyway ← highlightedList [:207]
    SM->>LM: moves.DecrementValue(1) [:244]
    SM->>LM: moveID++ [:246]

    alt itemMatching.matchable
        SM->>LM: FindMatches() → FallingDown() [:218,1489]
    else itemMatching.bonus
        SM->>LM: bonus.ActivateBonus(byTouch, cb) [:227]
    end
    end

    rect rgb(240, 230, 220)
    Note over Player,Tgt: Stage 4 — Resolve + Score
    LM->>LM: if destroyAnyway.Count ≥ 2 → ChangeType bonus [:1510]
    loop each item in destroyAnyway [:1551]
        LM->>DC: DestroyWithDelay(dc, pos, .05f) [:1557]
        DC->>Item: Hit(pos, cb) [:39,727]
        Item-->>DC: DestroyItem(showEffect)
        DC->>LM: DestroySpriteEvent(sprite) [:105]
        LM->>Tgt: OnDestroySprite?.Invoke [:1674]
    end
    LM->>LM: Score += Σ(score) × count [:1569]
    end

    rect rgb(225, 240, 245)
    Note over Player,Tgt: Stage 5 — Refill + Win/Lose
    LM->>Field: FinishDestroy() → FallAndGenerateItems() [:1273,1275]
    Field-->>LM: gravity + spawn done
    LM->>LM: CheckMovesAndTargets() [:1075]
    alt targets done → PreWinAnimation → Win
        LM->>LM: dummy
    else moves == 0 → PreFailed / GameOver
        LM->>LM: dummy
    end
    end`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Set the mermaid source
  await page.evaluate((code) => {
    const el = document.getElementById('source');
    el.value = code;
    el.dispatchEvent(new Event('input'));
  }, mermaidCode);
  
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\41_complex_seq_fixed.png' });
  
  await browser.close();
})();
