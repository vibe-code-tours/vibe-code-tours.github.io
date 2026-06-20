# Translation Guide — Burmese (my)

The Burmese locale lives in `src/i18n/my.json`. Every value that still needs
translation is prefixed with the marker `[MY] ` followed by the English source
text. A translator replaces the English with Burmese **and removes the `[MY] `
prefix**. Keys, URLs, email addresses, and handles must NOT be changed.

## How to translate

1. Open `src/i18n/my.json`.
2. Find a value beginning with `[MY] `.
3. Replace the English text with the Burmese translation.
4. Delete the leading `[MY] ` marker.
5. Save. Run `npm run build` to confirm it still builds.
6. Repeat until no `[MY] ` markers remain: `grep -c "\[MY\]" src/i18n/my.json`.

## Notes

- Do **not** translate: `meta.lang`, language labels, any URL, email, GitHub/X handle.
- The three legal pages (Terms, Code of Conduct, Privacy) keep their long body
  text in English inside the `*Body.astro` components. The Burmese versions show
  a "[MY] Burmese translation pending" banner (see `src/components/LegalNotice.astro`)
  until a translator localizes those components directly.
- Recommended translation priority (per source guide 06b):
  1. Home hero + 3 cards (`home.*`)
  2. Apply page (`apply.*`)
  3. FAQ top items (`faq.items[0..4]`)
  4. Code of Conduct Myanmar-context paragraphs
  5. Curriculum chapter outlines (`curriculum.*` + `src/data/chapters.ts`)
  6. About page (`about.*`)
  7. Everything else

## Regenerating

If English copy changes, regenerate the Burmese skeleton with:

```bash
node scripts/gen-my.mjs   # re-wraps en.json strings with [MY] markers (overwrites my.json)
```

WARNING: this overwrites existing Burmese translations. Run it only before any
real translation work has started, or merge carefully afterward.

## Keys needing translation (183 total)

- `brand.name`
- `brand.tagline`
- `nav.home`
- `nav.about`
- `nav.team`
- `nav.curriculum`
- `nav.apply`
- `nav.sponsors`
- `nav.faq`
- `nav.contact`
- `footer.rights`
- `footer.terms`
- `footer.coc`
- `footer.privacy`
- `footer.contact`
- `footer.license`
- `home.title`
- `home.description`
- `home.heroTitle`
- `home.heroStat`
- `home.heroSub`
- `home.ctaApply`
- `home.ctaWork`
- `home.card1Title`
- `home.card1Body`
- `home.card2Title`
- `home.card2Body`
- `home.card3Title`
- `home.card3Body`
- `home.credibility`
- `about.title`
- `about.description`
- `about.heading`
- `about.intro1`
- `about.intro2`
- `about.believeHeading`
- `about.beliefs[0].title`
- `about.beliefs[0].body`
- `about.beliefs[1].title`
- `about.beliefs[1].body`
- `about.beliefs[2].title`
- `about.beliefs[2].body`
- `about.beliefs[3].title`
- `about.beliefs[3].body`
- `about.beliefs[4].title`
- `about.beliefs[4].body`
- `about.notHeading`
- `about.notList[0]`
- `about.notList[1]`
- `about.notList[2]`
- `about.notList[3]`
- `about.notList[4]`
- `team.title`
- `team.description`
- `team.heading`
- `team.leadHeading`
- `team.photoAlt`
- `team.photoCaption`
- `team.name`
- `team.bio`
- `team.github`
- `team.x`
- `team.emailLabel`
- `team.advisorsHeading`
- `team.advisorsBody`
- `team.helpHeading`
- `team.helpBody`
- `curriculum.title`
- `curriculum.description`
- `curriculum.heading`
- `curriculum.intro`
- `curriculum.ctaSample`
- `curriculum.ctaDownload`
- `curriculum.readMore`
- `curriculum.startHere`
- `curriculum.tierHeading`
- `curriculum.tierIntro`
- `curriculum.tierA`
- `curriculum.tierB`
- `curriculum.tierC`
- `curriculum.tierNote`
- `curriculum.getHeading`
- `curriculum.commitHeading`
- `curriculum.get[0]`
- `curriculum.get[1]`
- `curriculum.get[2]`
- `curriculum.get[3]`
- `curriculum.get[4]`
- `curriculum.commit[0]`
- `curriculum.commit[1]`
- `curriculum.commit[2]`
- `curriculum.commit[3]`
- `curriculum.commit[4]`
- `apply.title`
- `apply.description`
- `apply.heading`
- `apply.closedBody`
- `apply.nextCohort`
- `apply.notifyHeading`
- `apply.notifyList[0]`
- `apply.notifyList[1]`
- `apply.lookHeading`
- `apply.lookIntro`
- `apply.lookList[0]`
- `apply.lookList[1]`
- `apply.lookList[2]`
- `apply.lookList[3]`
- `apply.lookList[4]`
- `apply.lookList[5]`
- `sponsors.title`
- `sponsors.description`
- `sponsors.heading`
- `sponsors.intro`
- `sponsors.cohort1Heading`
- `sponsors.cohort1List[0]`
- `sponsors.cohort1List[1]`
- `sponsors.cohort1List[2]`
- `sponsors.howHeading`
- `sponsors.orgHeading`
- `sponsors.orgIntro`
- `sponsors.orgList[0]`
- `sponsors.orgList[1]`
- `sponsors.orgList[2]`
- `sponsors.orgList[3]`
- `sponsors.orgContact`
- `sponsors.indHeading`
- `sponsors.indIntro`
- `sponsors.indList[0]`
- `sponsors.indList[1]`
- `sponsors.indList[2]`
- `sponsors.getHeading`
- `sponsors.getList[0]`
- `sponsors.getList[1]`
- `sponsors.getList[2]`
- `sponsors.getList[3]`
- `sponsors.noSell`
- `faq.title`
- `faq.description`
- `faq.heading`
- `faq.items[0].q`
- `faq.items[0].a`
- `faq.items[1].q`
- `faq.items[1].a`
- `faq.items[2].q`
- `faq.items[2].a`
- `faq.items[3].q`
- `faq.items[3].a`
- `faq.items[4].q`
- `faq.items[4].a`
- `faq.items[5].q`
- `faq.items[5].a`
- `faq.items[6].q`
- `faq.items[6].a`
- `faq.items[7].q`
- `faq.items[7].a`
- `faq.items[8].q`
- `faq.items[8].a`
- `faq.items[9].q`
- `faq.items[9].a`
- `faq.items[10].q`
- `faq.items[10].a`
- `faq.items[11].q`
- `faq.items[11].a`
- `faq.items[12].q`
- `faq.items[12].a`
- `contact.title`
- `contact.description`
- `contact.heading`
- `contact.applicants`
- `contact.sponsorship`
- `contact.sponsorshipNote`
- `contact.privacy`
- `contact.coc`
- `contact.channelsHeading`
- `contact.github`
- `contact.x`
- `contact.forwardNote`
- `terms.title`
- `terms.description`
- `coc.title`
- `coc.description`
- `privacy.title`
- `privacy.description`
