# Privacy notice

**Last updated:** 10 October 2026

**Status:** Draft for operator review — confirm the operator identity and monitor the linked contact channel; review this notice against the live Vercel settings and applicable privacy law before public Production.

This notice describes the current Environmental Impact Analyzer application. It is an engineering summary, not legal advice or a statement that the service complies with every privacy law. The person or organization operating a public deployment must review it against the actual Vercel project configuration and applicable law before launch.

## Operator and contact

- **Service operator:** Kyama Anjan Kumar
- **Privacy contact:** [Contact the service operator](https://k-anjan25.github.io/portfolio/contact.html)

Before a public Production deployment, the operator must confirm this is the correct service identity, monitor the linked contact channel for privacy requests, and review the operator's role and obligations under applicable privacy law.

## What the application does

The application lets a visitor select published apparel and footwear process factors, enter quantities in each factor's reference unit, and calculate separate process and indicator results. An optional v2 worksheet lets a visitor record input/component labels, amounts, and unit text and manually associate an input with a process row as context only. It does not create user accounts or save an assessment history, and it does not ask for a visitor's name or email address.

## Information processed

### Calculation inputs

When a visitor requests an estimate, the browser sends selected factor IDs and numeric quantities in the factors' exact reference units to the same-origin API. Factor-catalog requests may include a process-family or search query when those API options are used. The API uses the request to calculate and return the requested results in memory. It does not receive the optional product-input labels, quantities, unit text, or manual associations; those stay in browser page memory and are cleared when the page is reloaded or closed. The application does not intentionally write inputs or results to a database, file, account, or assessment history.

If the visitor downloads a CSV, the file can include the declared input labels, amounts, unit text, manual associations, and records for unassociated inputs. The visitor controls where that downloaded file is saved and shared.

Do not enter personal information, confidential business information, supplier secrets, or other sensitive data. The calculator is not designed to receive it.

### Technical and hosting information

The application source does not include advertising trackers, analytics services, or application-set cookies/local-storage persistence. The API container disables Uvicorn access logging and does not log calculation request bodies.

Vercel's infrastructure routes the HTTP request—including the calculation payload—to the running container so it can return a result. Vercel and network infrastructure may also process technical request information needed to deliver, secure, and troubleshoot the service. This can include an IP address, request time, URL/path, browser or device headers, response status, and related diagnostics. The application itself does not log or persist calculation bodies, but this project has not independently verified whether the live Vercel configuration records request bodies or what its exact retention periods are. The operator must check Vercel's live logs/settings before production; this notice does not claim provider-side logging is disabled. Vercel's [Privacy Notice](https://vercel.com/legal/privacy-policy) and [Terms of Service](https://vercel.com/legal/terms) apply to its services.

Vercel Preview protection, if enabled, may use Vercel-managed authentication or cookies. Those are controlled by Vercel, not by this application's code. Links opened to Carbonfact, GitHub, Zenodo, Creative Commons, or other external sites are subject to those sites' own privacy practices.

## Purposes and sharing

The browser sends only the selected factor IDs and their separately entered reference-unit quantities to the Vercel-hosted API to return the requested calculation. Optional product-input notes and associations remain in browser memory unless the visitor chooses to include them in a downloaded CSV. Hosting and network providers handle API requests to provide the service and may process technical information for delivery, reliability, abuse prevention, and security under their own terms. The application source does not send inputs to advertising or analytics services. The project does not sell personal information or use it for advertising.

## Storage, retention, and location

The application has no persistent assessment store. Declared product-input notes exist only in browser page memory. Calculation factor IDs and process quantities are processed by the running API instance to answer the request. This does not control provider-side network or deployment logs. Provider retention, processing regions, and any international transfer depend on Vercel account, deployment, and service settings; the operator must check and document those settings before production.

## Your choices and requests

You can stop using the service and clear in-page selections by reloading or closing the page. Because the application does not create assessment accounts or persist calculations, it cannot retrieve or delete an assessment record that it never stored. For a privacy question or request concerning the service, contact the operator using the completed contact information above. Requests concerning Vercel-held information may also need to be directed to Vercel under its own notice.

## Security

The application uses same-origin API requests and applies basic browser security headers. No internet service can guarantee perfect security. Do not submit information that should not be processed by a public web service.

## Changes

The operator may update this notice as the service or hosting configuration changes. The `Last updated` date will be revised when a material change is published.
