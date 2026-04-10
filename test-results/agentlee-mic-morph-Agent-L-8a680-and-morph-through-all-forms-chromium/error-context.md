# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agentlee-mic-morph.spec.ts >> Agent Lee Mic >> should render and morph through all forms
- Location: docs\tests\agentlee-mic-morph.spec.ts:6:3

# Error details

```
TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="agentlee-mic-root"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:react-babel] D:\\AgentLeecompletesystem\\agent-lee-voxel-os (1)\\components\\AgentleeMic.tsx: Unexpected token (298:29) 301 | </div>"
  - generic [ref=e5]: D:/AgentLeecompletesystem/agent-lee-voxel-os (1)/components/AgentleeMic.tsx:298:29
  - generic [ref=e6]: "300| {MORPH_FORMS[morphIndex]} 301| </div> 302| {/* LeeWay RTC Call Mode UI (handles RTC connection, voice, and state) */} | ^ 303| <div className=\"absolute bottom-2 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-1 pointer-events-auto z-10\"> 304| <CallModeUI />"
  - generic [ref=e7]: at constructor (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:365:19) at TypeScriptParserMixin.raise (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:6599:19) at TypeScriptParserMixin.unexpected (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:6619:16) at TypeScriptParserMixin.parseExprAtom (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:11442:22) at TypeScriptParserMixin.parseExprAtom (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:4764:20) at TypeScriptParserMixin.parseExprSubscripts (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:11081:23) at TypeScriptParserMixin.parseUpdate (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:11066:21) at TypeScriptParserMixin.parseMaybeUnary (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:11046:23) at TypeScriptParserMixin.parseMaybeUnary (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:9837:18) at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10899:61) at TypeScriptParserMixin.parseExprOps (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10904:23) at TypeScriptParserMixin.parseMaybeConditional (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10881:23) at TypeScriptParserMixin.parseMaybeAssign (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10831:21) at TypeScriptParserMixin.parseMaybeAssign (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:9786:20) at TypeScriptParserMixin.parseExpressionBase (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10784:23) at D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10780:39 at TypeScriptParserMixin.allowInAnd (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:12421:16) at TypeScriptParserMixin.parseExpression (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10780:17) at TypeScriptParserMixin.parseStatementContent (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:12895:23) at TypeScriptParserMixin.parseStatementContent (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:9508:18) at TypeScriptParserMixin.parseStatementLike (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:12767:17) at TypeScriptParserMixin.parseModuleItem (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:12744:17) at TypeScriptParserMixin.parseBlockOrModuleBlockBody (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:13316:36) at TypeScriptParserMixin.parseBlockBody (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:13309:10) at TypeScriptParserMixin.parseProgram (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:12622:10) at TypeScriptParserMixin.parseTopLevel (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:12612:25) at TypeScriptParserMixin.parse (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:14488:25) at TypeScriptParserMixin.parse (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:10126:18) at parse (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\parser\lib\index.js:14522:38) at parser (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\core\lib\parser\index.js:41:34) at parser.next (<anonymous>) at normalizeFile (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\core\lib\transformation\normalize-file.js:64:37) at normalizeFile.next (<anonymous>) at run (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\core\lib\transformation\index.js:22:50) at run.next (<anonymous>) at transform (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\core\lib\transform.js:22:33) at transform.next (<anonymous>) at step (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:261:32) at D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:273:13 at async.call.result.err.err (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:223:11) at D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:189:28 at D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\@babel\core\lib\gensync-utils\async.js:67:7 at D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:113:33 at step (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:287:14) at D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:273:13 at async.call.result.err.err (D:\AgentLeecompletesystem\agent-lee-voxel-os (1)\node_modules\gensync\index.js:223:11
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```