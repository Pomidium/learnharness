# Upstream sync

The fork's `main` is merged with `amosblomqvist/learnharness` `main` each Monday at 07:17 UTC, or by running **Sync upstream main** manually from the fork's Actions tab on `main`. This keeps both commit histories and the fork's Omnilearn changes; it never resets, rebases, or force-pushes. An already-integrated upstream tip makes no commit or report.

A conflict fails that workflow run with a GitHub Actions error annotation and leaves the remote fork's `main` unchanged. To resolve it, start a branch from the latest fork `main`, fetch upstream `main`, merge it into that branch, resolve conflicts, then submit the branch for normal review. Re-running the workflow before resolving conflicts will fail again. The workflow does not open issues or post recurring comments. A concurrent update to fork `main` rejects the ordinary push rather than overwriting it; rerun against the new tip.

The job needs repository Contents write permission for the push. Its checkout does not retain credentials. Repository settings must allow GitHub Actions to write repository contents, and branch protection must allow this bot push; otherwise the push fails safely. Pushes made using the workflow's built-in token do not trigger other push workflows, so run CI separately before relying on an automated merge.
