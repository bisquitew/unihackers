// Makes StyleSheet styles follow the light/dark theme live.
//
// `StyleSheet.create({ box: { backgroundColor: colors.background } })` reads `colors.background` once, when the file loads,
// so the style would keep the colour it started with. This plugin rewrites every style property in a StyleSheet.create call
// that reads the theme tokens (colors, palette, isDark) into a getter:
//     box: { get backgroundColor() { return colors.background } }
// React Native reads a style's properties each time the component renders, so after the tokens change (tokens.ts updates
// them in place) the next render picks up the new colour. Nothing else in the code has to change.
module.exports = function liveTheme({ types: t }) {
  const TOKENS = new Set(['colors', 'palette', 'isDark']);

  const unwrap = (node) => {
    let n = node;
    while (n && (n.type === 'TSAsExpression' || n.type === 'TSSatisfiesExpression' || n.type === 'TSNonNullExpression' || n.type === 'ParenthesizedExpression' || n.type === 'TypeCastExpression')) n = n.expression;
    return n;
  };

  const isStyleSheetCreate = (callee) =>
    t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.object, { name: 'StyleSheet' }) && t.isIdentifier(callee.property, { name: 'create' });

  // true when the expression reads a theme token that this file imports (not a local variable that happens to share the name)
  const readsImportedToken = (scope, node) => {
    let found = false;
    t.traverseFast(node, (n) => {
      if (found || !t.isIdentifier(n) || !TOKENS.has(n.name)) return;
      const binding = scope.getBinding(n.name);
      if (binding && binding.kind === 'module') found = true;
    });
    return found;
  };

  return {
    name: 'live-theme',
    visitor: {
      CallExpression(path) {
        if (!isStyleSheetCreate(path.node.callee)) return;
        const arg = path.node.arguments[0];
        const sheet = unwrap(arg);
        if (!t.isObjectExpression(sheet)) return;

        for (const entry of sheet.properties) {
          if (!t.isObjectProperty(entry)) continue; // spreads and methods are left alone
          const style = unwrap(entry.value);
          if (!t.isObjectExpression(style)) continue;
          style.properties = style.properties.map((prop) => {
            if (!t.isObjectProperty(prop) || prop.computed) return prop;
            if (!readsImportedToken(path.scope, prop.value)) return prop;
            return t.objectMethod('get', prop.key, [], t.blockStatement([t.returnStatement(prop.value)]));
          });
        }
      },
    },
  };
};
