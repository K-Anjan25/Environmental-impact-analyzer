# Privacy notice

**Last updated:** 10 October 2026

**Status:** Release draft — the operator and privacy contact below must be completed before public production.

This notice describes the current Environmental Impact Analyzer application. It is an engineering summary, not legal advice or a statement that the service complies with every privacy law. The person or organization operating a public deployment must review it against the actual Vercel project configuration and applicable law before launch.

## Operator and contact

- **Service operator:** `[Enter the legal name of the person or organization operating the service]`
- **Privacy contact:** `[Enter a monitored privacy email address or contact URL]`

The operator must identify its role under applicable privacy law and complete these fields before a public Production deployment. Do not publish while they are placeholders.

## What the application does

The application lets a visitor select published apparel and footwear process factors, enter quantities in each factor's reference unit, and calculate separate process and indicator results. It does not create user accounts, save an assessment history, or ask for a visitor's name, email address, or product identity.

## Information processed

### Calculation inputs

When a visitor requests an estimate, the browser sends selected factor IDs and numeric quantities to the same-origin API. Factor-catalog requests may include a process-family or search query when those API options are used. The API uses the request to calculate and return the requested results in memory. The application does not intentionally write these inputs or results to a database, file, account, or assessment history. Browser selections remain in page memory and are cleared when the page is reloaded or closed.

Do not enter personal information, confidential business information, or other sensitive data. The calculator is not designed to receive it.

### Technical and hosting information

The application source does not include advertising trackers, analytics services, or application-set cookies/local-storage persistence. The API container disables Uvicorn access logging and does not log calculation request bodies.

The hosting provider, Vercel, and network infrastructure may process technical request information needed to deliver, secure, and troubleshoot the service. This can include an IP address, request time, URL/path, browser or device headers, response status, and related diagnostics. The exact information and retention period depend on the live project configuration and Vercel's current policies; this project does not claim that infrastructure logs are disabled or that network metadata is never retained. Vercel's [Privacy Notice](https://vercel.com/legal/privacy-policy) and [Terms of Service](https://vercel.com/legal/terms) apply to its services.

Vercel Preview protection, if enabled, may use Vercel-managed authentication or cookies. Those are controlled by Vercel, not by this application's code. Links opened to Carbonfact, GitHub, Zenodo, Creative Commons, or other external sites are subject to those sites' own privacy practices.

## Purposes and sharing

Calculation inputs are used to return the requested calculation. Hosting and network providers process technical information for delivery, reliability, abuse prevention, and security under their own terms. The project does not sell personal information or use it for advertising. The project does not otherwise disclose calculation inputs to third parties through application code.

## Storage, retention, and location

The application has no persistent assessment store. Calculation inputs exist in browser memory and are processed by the running API instance to answer the request. This does not control provider-side network or deployment logs. Provider retention, processing regions, and any international transfer depend on Vercel account, deployment, and service settings; the operator must check and document those settings before production.

## Your choices and requests

You can stop using the service and clear in-page selections by reloading or closing the page. Because the application does not create assessment accounts or persist calculations, it cannot retrieve or delete an assessment record that it never stored. For a privacy question or request concerning the service, contact the operator using the completed contact information above. Requests concerning Vercel-held information may also need to be directed to Vercel under its own notice.

## Security

The application uses same-origin API requests and applies basic browser security headers. No internet service can guarantee perfect security. Do not submit information that should not be processed by a public web service.

## Changes

The operator may update this notice as the service or hosting configuration changes. The `Last updated` date will be revised when a material change is published.
