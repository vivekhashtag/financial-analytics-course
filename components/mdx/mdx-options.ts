import remarkGfm from 'remark-gfm';

/**
 * The MDX compile options, in one place.
 *
 * Extracted from `MdxContent` so a component that needs to render a prose
 * fragment can do so without importing `MdxContent` itself. That matters
 * because `MdxContent` owns the widget registry and imports every widget: a
 * widget importing it back would close an import cycle, and the options are the
 * only part of it a plain prose renderer actually needs.
 */
// Not `as const`: MDXRemote's option type wants a mutable `Pluggable[]`, and a
// readonly array is not assignable to it.
export const MDX_OPTIONS = {
  parseFrontmatter: false,
  mdxOptions: { remarkPlugins: [remarkGfm] },

  // next-mdx-remote 6 blocks JS expressions in MDX by default, which strips
  // every expression prop this content is built on — `tree={[…]}`,
  // `stats={[…]}`, `cards={[…]}`, `codeIndex={0}`. With blockJS left at its
  // default, DecisionTree receives `tree: undefined` and the build dies
  // prerendering Module 2's structures page.
  //
  // Turning it off is safe *here specifically*: every MDX file is first-party,
  // lives in this repo, and is schema-validated in CI. There is no path for a
  // third party to submit MDX. If that ever changes — user-supplied or
  // CMS-authored MDX — this must go back to true and the affected props move
  // into module.json instead.
  blockJS: false,

  // Still enforced: no eval, Function, process, require or other dangerous
  // globals, even with JS expressions allowed.
  blockDangerousJS: true,
};
