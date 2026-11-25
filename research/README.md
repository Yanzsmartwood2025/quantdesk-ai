# Educational multi-agent evidence review (isolated)

This folder is a **self-contained classroom exercise** in assessing a fictional debate. Its sample uses imaginary paper-plane observations. It has no external dependencies, credentials, network access, database connection, market data, trading signals, order execution, or integration with the existing application. Do not import it into the live application.

## Purpose and limitations
- Each note identifies a role, a testable claim, an assessment, evidence identifiers, and reported confidence.
- The reviewer reports disagreement, missing or invalid citations, and unsupported confidence. Any uncertainty requests human review.
- The output is a quality label only. Agreement is not evidence of factual accuracy, and saving a record does not train a model.
- This module is unsuitable for financial decision-making, automated transactions, or assessing economic performance.
- Real datasets require data governance, source checks, protection against future-information leakage, independent validation, and human oversight. No provider is configured here.

## Commands
Run in a clean checkout with Python 3:
```sh
python3 -m unittest discover -s research/tests -v
python3 -m research.educational_evidence_review
```

## Why separate?
The existing application contains direct service integrations and an execution path. The educational experiment is deliberately **not wired into any of them**. No .env, database migrations, Coolify resources, or service configuration is changed.
