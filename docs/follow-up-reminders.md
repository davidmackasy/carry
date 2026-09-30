# Follow-up reminders

Gift sends one daily outstanding-update digest, beginning the local calendar day after an expected paycheck or unpaid bill. It uses the saved email time and existing authenticated account recipient. Email opt-in, active subscription, payday/bill preferences, bill-notification preference, and the new daily-follow-up preference all apply. Existing reminder users have daily follow-ups enabled unless they turn the setting off.

The daily digest has one stable delivery ID per user and local date, so the 15-minute scheduler does not repeatedly send it. Existing delivery claims handle overlapping runs. The job reads the profile again immediately before sending and rebuilds the message from still-outstanding items. A confirmation that occurs after provider submission cannot recall an email already sent.

Confirming the specific deposit, recording the bill payment, changing a schedule, pausing a bill, or disabling its reminder removes it from subsequent digests. Each recurring occurrence is evaluated separately. The lookback matches the existing bill calculation limit of 3,660 days. The email includes up to 20 details and directs users to review any remaining items in Gift. The paycheck review screen now also includes older unconfirmed occurrences instead of only the latest 31-day window.

## Templates

Subject: Gift · Did your paycheck arrive?

A little check-in to keep your plan accurate. These items are still unconfirmed in Gift:

Paycheck · expected 2026-09-28 (yesterday), estimated $1,000.00. Did it arrive? Gift doesn’t have a recorded deposit yet. If it arrived, confirm the actual amount. If the date changed, update your income schedule.

Subject: Gift · A quick check on your bill

Rent · due 2026-09-28 (3 days ago), $500.00. Was this paid? Gift doesn’t have a recorded payment yet. If you paid it, mark it paid. If the plan changed, edit or pause the bill.

Subject for multiple items: Gift · A quick check on 3 budget updates

Shared closing: Already taken care of? Record it in Gift and its follow-ups will stop. Nothing is added to your balance or marked paid automatically. You can turn off daily follow-ups in reminder settings.

All templates include the branded Gift sender, a link opening the notification review, a statement that Gift has not verified deposits or made payments, and email opt-out instructions. The notification review links to unpaid bills and unconfirmed paychecks. The text never asserts that a person failed to pay or did not receive money just because Gift has no record. Grocery guesses and goal projections are not treated as missed obligations.
