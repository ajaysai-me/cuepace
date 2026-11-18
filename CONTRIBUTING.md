# Contributing to CuePace

Thanks for wanting to help. Every contribution counts, from fixing a typo to building a feature. If anything here is unclear, open an issue and ask: questions are contributions too.

## Ways to help

- **Report a bug**: open an issue with the *Bug report* template. Include your phone model, OS version and the steps to reproduce.
- **Suggest a feature**: open an issue with the *Feature request* template and describe the problem it solves.
- **Improve the docs**: README, code comments, this guide.
- **Write code**: pick an issue labelled `good first issue` or `help wanted`. Comment on it so others know you're working on it.
- **Design**: icons, screens, accessibility and motion ideas are very welcome.

## Set up the project

Requirements: Node.js 20+, and for native builds JDK 17 with the Android SDK, or Xcode on a Mac.

```bash
git clone <your-fork-url>
cd cuepace
npm install
npx expo start
```

Native folders (`android/`, `ios/`) are generated and git-ignored. Change native behavior through `app.json` and config plugins. To add a dependency, use `npx expo install <package>` so it gets a version that matches the SDK.

## Before you open a pull request

Run both checks; CI runs them too:

```bash
npm run typecheck
npm run lint
```

Then:

1. Create a branch from `main` with a short, descriptive name, such as `fix/countdown-reset` or `feat/import-txt`.
2. Keep each pull request focused on one change. Small pull requests get reviewed faster.
3. Test on a real device when you touch the camera, recording or scrolling.
4. Add screenshots or a short screen recording for anything visual.
5. Fill in the pull request template.

## Code style

- TypeScript, strict mode. Avoid `any`.
- Screens go in `src/app/`; shared components in `src/components/`; logic and storage in `src/lib/`.
- Use colors, fonts and spacing from `src/lib/theme.ts` instead of hard-coding values.
- Keep everything on-device. CuePace has no server, and new features shouldn't add one without a discussion first.
- Write comments that explain *why*, not *what*.

## Commit messages

Use the imperative mood and keep the first line under 72 characters, for example `Fix countdown not resetting after stop`. Add detail in the body if it helps reviewers.

## Licensing

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
