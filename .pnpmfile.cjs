// Allow esbuild's install script
function readPackage(pkg) {
  return pkg;
}
module.exports = { hooks: { readPackage } };
