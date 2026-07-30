# BétonDispo --- Payment & Commission Strategy

## Purpose

This document defines a phased payment strategy for BétonDispo.

The initial objective is to keep operations simple while the business
validates demand, contractor relationships and the real-world workflow
of concrete delivery and related services.

BétonDispo should initially avoid collecting the full customer payment.

If the marketplace reaches sufficient scale, payment processing can
later move onto the BétonDispo platform.

## Phase 1 --- Customer Pays Vendor Directly

Initial flow:

`Customer → BétonDispo → Vendor → Customer pays Vendor → Vendor performs job → Vendor owes BétonDispo commission`

Example:

1.  Customer requests approximately 7 m³ of concrete in Brossard.
2.  BétonDispo finds an appropriate vendor.
3.  Vendor confirms availability and a customer price of CAD \$1,600.
4.  Customer accepts the option.
5.  Vendor invoices/charges the customer directly.
6.  Vendor performs the job.
7.  If the BétonDispo fee is 10%, the vendor owes BétonDispo CAD \$160.

## Why Start This Way

This model intentionally keeps BétonDispo away from several operational
complexities during early validation.

The vendor initially remains responsible for:

- Customer payment collection
- Payment processing fees
- Invoicing
- Applicable taxes
- Refunds
- Payment disputes
- Chargebacks
- Deposits
- Final job adjustments

This allows BétonDispo to concentrate on its core early-stage problem:

**Generating demand and matching customers with available
concrete-service vendors.**

## BétonDispo Revenue

BétonDispo earns a commission or marketplace fee on successfully
completed jobs.

Possible initial model:

`Platform Fee = Completed Job Value × Commission Rate`

Example:

`CAD $1,600 × 10% = CAD $160`

The exact fee structure can evolve based on contractor economics and
market response.

## Preventing Commission Leakage

The major weakness of vendor-direct payments is that BétonDispo does not
automatically know whether the customer ultimately paid the contractor.

The system therefore needs basic job tracking even during the manual
phase.

Every request should receive a unique BétonDispo job/request ID.

Example:

`BD-2026-001842`

The lifecycle could include:

- New
- Matching
- Vendor contacted
- Vendor accepted
- Customer option sent
- Customer accepted
- Scheduled
- Completed
- Cancelled
- Disputed
- Commission due
- Commission paid

## Contractor Acceptance

Before receiving the full customer opportunity, the contractor should
accept the BétonDispo marketplace/referral terms.

Acceptance should associate:

- Contractor
- Job ID
- Commission rate
- Date/time
- Commercial terms

This creates an auditable record of which opportunities originated from
BétonDispo.

## Completion Verification

After the scheduled job date, the system can verify completion.

Possible methods:

- Contractor marks job completed.
- Customer receives a short completion confirmation.
- BétonDispo staff confirms manually when necessary.

The early version can be manual.

Automation should come after actual operating patterns are understood.

## Contractor Billing

Instead of collecting a fee after every individual job, BétonDispo could
aggregate commissions.

Example:

Weekly contractor statement:

- Job BD-1842 --- CAD \$160
- Job BD-1861 --- CAD \$220
- Job BD-1880 --- CAD \$95

Total due: CAD \$475

Monthly billing is another possibility.

The best cadence should be determined from actual contractor behavior
and transaction volume.

## Marketplace Enforcement

At scale, BétonDispo's strongest protection against unpaid commissions
is access to future demand.

Possible policy:

- Outstanding invoice warning
- Grace period
- New opportunities temporarily restricted
- Account suspended if commissions remain unpaid

A contractor receiving meaningful revenue from BétonDispo has an
economic incentive to keep the account in good standing.

## Do Not Over-Automate Phase 1

Early operations will expose issues that are difficult to predict in
software.

Examples:

- Weather cancellations
- Customer rescheduling
- Contractor delays
- Incorrect volume estimates
- Additional concrete required
- Unused concrete
- Pump requirements discovered later
- Waiting-time charges
- Short-load fees
- Difficult site access
- Customer no-shows
- Contractor no-shows
- Equipment problems
- Price changes after site details become known
- Partial completion

For this reason, the first payment/commission workflow should remain
operationally flexible.

The objective is to learn before automating.

## Future Phase --- BétonDispo Collects Customer Payment

Once sufficient marketplace volume and operational knowledge exist,
BétonDispo can evaluate becoming the payment layer.

Future flow:

`Customer → BétonDispo → Contractor`

BétonDispo could:

1.  Collect customer payment.
2.  Record the transaction.
3.  Retain its marketplace fee.
4.  Pay the contractor.
5.  Handle payment status and payout reconciliation.

Example:

Customer payment: CAD \$1,600\
BétonDispo marketplace fee: CAD \$160\
Contractor amount before other applicable adjustments: CAD \$1,440

The exact legal, tax, payment-processing and marketplace structure must
be reviewed before implementing this model.

## Why Move Payments Onto the Platform Later

Potential benefits include:

- Automatic commission collection
- Reduced commission leakage
- Better transaction data
- Easier reconciliation
- Contractor payouts
- Deposits
- Customer payment status
- Potential instant booking
- Better marketplace conversion tracking

But it also creates additional responsibilities around refunds,
disputes, payment processing and marketplace operations.

Therefore it should follow product-market validation rather than precede
it.

## Data Model Should Support Both Models

Even if Phase 1 uses direct vendor payment, the application should avoid
a database design that assumes this will always be the case.

Possible fields:

```text
job_id
customer_id
vendor_id

estimated_volume_m3

customer_price
vendor_price

platform_fee_type
platform_fee_rate
platform_fee_amount

payment_model
payment_status

vendor_invoice_status
platform_invoice_status

customer_payment_amount
vendor_payout_amount
refund_amount

scheduled_at
completed_at
cancelled_at

job_status
```

Possible `payment_model` values:

```text
vendor_direct
platform
```

Initially almost every transaction would use:

`vendor_direct`

Later, both models could coexist during migration.

## Suggested Evolution

### Phase 1 --- Manual + Vendor Direct

Customer pays contractor directly. BétonDispo manually tracks completed
jobs and invoices contractors.

### Phase 2 --- Contractor Dashboard

Contractors accept jobs and mark completion through the dashboard.
Commission calculations become automatic.

### Phase 3 --- Automated Contractor Billing

BétonDispo generates weekly/monthly statements and tracks outstanding
marketplace fees.

### Phase 4 --- Selected Platform Payments

BétonDispo experiments with platform payments for certain vendors or job
types.

### Phase 5 --- Integrated Marketplace Payments

Customers can pay through BétonDispo, platform fees are retained
automatically, and contractor payouts are managed through the platform.

## Core Principle

Do not build a complex payment system before understanding the
operational reality of the marketplace.

Start with:

**Demand → match → vendor payment → completed-job commission**

Learn from real transactions.

Then automate the parts that repeatedly create operational friction.
