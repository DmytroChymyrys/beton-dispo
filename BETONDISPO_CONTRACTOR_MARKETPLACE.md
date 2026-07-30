# BétonDispo --- Future Contractor Marketplace & Job Bidding

## Purpose

This document describes a future evolution of BétonDispo after the
platform has proven that it can generate a consistent volume of
concrete-related requests.

The goal is to evolve from manual lead matching into a contractor
marketplace where qualified vendors can see incoming jobs, submit
availability and commercial terms, and compete for work.

This is a future-phase concept, not an immediate MVP requirement.

## Core Idea

Once BétonDispo generates enough demand, each contractor can receive
access to a private dashboard containing relevant incoming requests.

A typical request could include:

- Service location
- Approximate concrete volume in m³
- Project type
- Requested date
- Preferred time window
- Whether pumping is required
- Site-access information
- Customer requirements
- Photos or project notes when available

Example:

> Brossard --- 6.5 m³ --- foundation --- August 4 --- morning --- pump
> required

Only contractors matching the service type and geographic area should
see the opportunity.

## Contractor Response

A contractor should be able to respond with information such as:

- Available / unavailable
- Earliest availability
- Proposed customer price
- Estimated arrival or delivery window
- Platform fee / commission offered
- Additional conditions
- Optional notes

The response should be quick enough to support time-sensitive
construction jobs.

## Base Platform Fee

A possible marketplace model is a base BétonDispo fee of approximately
10% for completed jobs.

Contractors could optionally offer a higher marketplace fee when they
want to improve their position for a particular job.

Example:

- 10% --- base participation
- 12% --- stronger marketplace economics
- 15% --- stronger marketplace economics
- 18% --- stronger marketplace economics

However, the job should **not automatically go to the contractor paying
BétonDispo the highest commission**.

The platform should protect customer value and marketplace quality.

## Ranking Instead of a Pure Auction

BétonDispo should eventually rank contractor offers using several
variables.

Possible variables:

- Customer price
- Availability
- Response speed
- Distance / service area
- Contractor completion rate
- Cancellation rate
- Customer feedback
- Historical reliability
- Ability to meet the requested time window
- Platform commission
- Relevant equipment/capabilities

Conceptually:

`Match Score = customer value + availability + reliability + response speed + platform economics`

The exact weights should be determined later from real marketplace data.

Platform commission can improve ranking, but it should be only one
variable.

## Why Availability Matters

Concrete is operationally time-sensitive.

A contractor capable of delivering tomorrow morning may be significantly
more useful to a customer than a cheaper contractor available four days
later.

Therefore the marketplace should treat availability as a first-class
variable.

Eventually contractors should be able to publish available capacity
proactively.

Example:

> South Shore\
> One truck available\
> Today 13:00--16:00\
> Up to 8 m³

BétonDispo could then match new requests against idle capacity.

This creates value for both sides:

- Customers receive faster service.
- Contractors monetize otherwise unused truck/equipment capacity.
- BétonDispo increases conversion and marketplace revenue.

## Contractor Dashboard --- Future Features

A future contractor dashboard could include:

### Incoming Requests

New jobs matching the contractor's geography and capabilities.

### Open Opportunities

Jobs the contractor can still respond to.

### Submitted Offers

Offers already submitted and their status.

### Won Jobs

Confirmed jobs awarded to the contractor.

### Lost / Expired Jobs

Opportunities that were awarded elsewhere or expired.

### Availability

Contractors can publish truck, pump, crew or delivery capacity.

### Service Areas

Define cities, postal regions or radius-based coverage.

### Capabilities

Examples:

- Ready-mix concrete delivery
- Mobile / volumetric concrete
- Concrete pumping
- Small-volume jobs
- Residential
- Commercial
- Foundations
- Slabs

### Pricing Rules

Future possibility for contractors to define:

- Minimum order
- Price per m³
- Delivery fees
- Distance fees
- Pumping fees
- Waiting-time charges
- Short-load fees

### Platform Fees

Show the agreed base commission and any job-specific commission offered.

### Performance

Possible metrics:

- Response time
- Acceptance rate
- Completion rate
- Cancellation rate
- Customer feedback

### Billing

Show BétonDispo commissions owed, paid and outstanding.

## Marketplace Flywheel

The long-term marketplace effect can become:

More customer traffic\
→ more quote requests\
→ more valuable contractor participation\
→ more contractors and available capacity\
→ faster/better matches\
→ higher customer conversion\
→ more profitable marketing and SEO\
→ more customer traffic

The strategic asset becomes the demand and matching layer rather than
ownership of trucks or concrete equipment.

## Important Marketplace Principle

BétonDispo should not position the marketplace as:

> Whoever pays us the most wins.

The platform should instead optimize for:

> The strongest available option for the customer's request while
> maintaining sustainable marketplace economics.

This distinction is important for customer trust, contractor quality and
long-term marketplace health.

## Suggested Evolution

### Phase 1

Manual matching of customer requests to vendors.

### Phase 2

Simple contractor portal showing assigned or available requests.

### Phase 3

Contractors submit availability and pricing.

### Phase 4

Multiple eligible contractors can respond to the same opportunity.

### Phase 5

Automated ranking and matching.

### Phase 6

Contractors publish real-time/near-real-time available capacity.

### Phase 7

Marketplace becomes increasingly automated using historical performance
and conversion data.

## Product Design Principle

Do not build the full auction marketplace before BétonDispo has enough
demand.

Traffic and customer requests should come first.

The marketplace functionality becomes valuable when contractors can log
in and consistently see real revenue opportunities.
