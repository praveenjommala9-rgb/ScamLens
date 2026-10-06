insert into public.scenarios (
  id, title, channel, category, difficulty, sender_name, sender_address,
  subject, body, displayed_url, correct_answer, red_flags, explanation, active
) values
(
  '20000000-0000-4000-8000-000000000001', 'Unusual card activity review', 'email', 'Banking & Payment', 'easy',
  'Riverglass Account Desk', 'alerts@riverglass.example', 'Review a card alert',
  'A purchase was flagged. The message says access will be paused in 30 minutes unless you confirm your sign-in on the page below.',
  'verify.riverglass.example/card', 'phishing',
  '["Urgency","Suspicious link/domain","Credential request","Unusual sender"]'::jsonb,
  'The short deadline and request to enter sign-in details through a message link are strong warning signs. Open the bank app or type its known address yourself.', true
),
(
  '20000000-0000-4000-8000-000000000002', 'Card purchase confirmation', 'sms', 'Banking & Payment', 'easy',
  'Riverglass Alerts', null, null,
  'A purchase of $24.80 on card ending 1842 was approved today. If you do not recognize it, open the Riverglass app and review recent activity. We will never ask for your password by text.',
  null, 'legitimate', '[]'::jsonb,
  'This notice gives a specific transaction and directs you to use the app rather than a supplied sign-in link. Do not reply with personal details.', true
),
(
  '20000000-0000-4000-8000-000000000003', 'Payment reversal fee request', 'chat', 'Banking & Payment', 'medium',
  'Billing Support', 'case-team@riverglass.example', 'Payment reversal',
  'The transfer can be reversed today, but first send a small processing payment to the recovery wallet shown in this chat. The case will close at 5 PM.',
  null, 'phishing', '["Urgency","Payment request","Unusual sender"]'::jsonb,
  'A request to send a separate payment to recover a transfer is not a safe bank procedure. Contact the institution through the app or a verified phone number.', true
),
(
  '20000000-0000-4000-8000-000000000004', 'Monthly statement available', 'email', 'Banking & Payment', 'medium',
  'Riverglass Statements', 'statements@riverglass.example', 'Your monthly statement is ready',
  'Your monthly statement is available in the Riverglass app. Sign in the way you normally do to review it. This message does not contain an attachment or a sign-in button.',
  null, 'legitimate', '[]'::jsonb,
  'The message gives a routine notice and asks you to navigate to the app yourself. That avoids a link-based credential request.', true
),
(
  '20000000-0000-4000-8000-000000000005', 'Refund pending confirmation', 'social', 'Banking & Payment', 'hard',
  'Riverglass Resolution', 'help@riverglass.example', 'Refund follow-up',
  'A support account replies to your public comment and says a refund is ready. It asks you to confirm the account number and a one-time code in a private form.',
  'secure.riverglass.example/refund', 'phishing',
  '["Impersonation","Suspicious link/domain","Credential request","Payment request"]'::jsonb,
  'A one-time code and account details should not be shared through a social message. Use the official app to contact support about the refund.', true
),
(
  '20000000-0000-4000-8000-000000000006', 'New sign-in warning', 'email', 'Account Takeover', 'easy',
  'Cloudleaf Security', 'security@cloudleaf.example', 'New sign-in detected',
  'A sign-in was detected from a new browser. The message asks you to review activity using the button and enter your password to keep the account open.',
  'account-check.cloudleaf.example/login', 'phishing',
  '["Urgency","Suspicious link/domain","Credential request","Unusual sender"]'::jsonb,
  'Unexpected sign-in messages should not send you to a password form through a link. Open the service directly and review active sessions there.', true
),
(
  '20000000-0000-4000-8000-000000000007', 'Sign-in from a new device', 'login', 'Account Takeover', 'easy',
  'Cloudleaf Security', null, 'New device signed in',
  'A new device signed in to your account at 10:42 AM. If this was you, no action is needed. If it was not you, open account settings from the app you normally use.',
  null, 'legitimate', '[]'::jsonb,
  'This alert reports an event without asking for a password or code. The safe next step is to open the account directly if you do not recognize it.', true
),
(
  '20000000-0000-4000-8000-000000000008', 'One-time code requested by support', 'chat', 'Account Takeover', 'medium',
  'Cloudleaf Help', 'help@cloudleaf.example', 'Finish account recovery',
  'The agent says the recovery is nearly done and asks you to paste the six-digit sign-in code here so they can verify your identity.',
  null, 'phishing', '["Credential request","Impersonation"]'::jsonb,
  'One-time sign-in codes are proof of account access. A support agent should not ask you to share one in chat.', true
),
(
  '20000000-0000-4000-8000-000000000009', 'Security settings changed', 'sms', 'Account Takeover', 'medium',
  'Cloudleaf Security', null, null,
  'Your recovery email was updated today. If you made this change, no action is needed. If not, open Cloudleaf account settings directly and review recovery options.',
  null, 'legitimate', '[]'::jsonb,
  'The notification does not ask you to reply or follow a link. Reviewing settings directly is safer than using an unexpected message link.', true
),
(
  '20000000-0000-4000-8000-000000000010', 'Recovery desk asks for backup phrase', 'social', 'Account Takeover', 'hard',
  'Cloudleaf Recovery Desk', 'recovery@cloudleaf.example', 'Urgent recovery follow-up',
  'A profile using the service logo says your account will be permanently locked unless you send the recovery phrase in a private reply.',
  null, 'phishing', '["Threatening language","Credential request","Impersonation","Unusual sender"]'::jsonb,
  'A recovery phrase gives full access to an account and must never be sent to a person. Use the service recovery flow you open yourself.', true
),
(
  '20000000-0000-4000-8000-000000000011', 'Parcel held for address check', 'sms', 'Delivery / Parcel', 'easy',
  'Parcelway Updates', null, null,
  'Your parcel is on hold because the street number could not be confirmed. Pay a small redelivery fee using the link before the end of the day.',
  'track.parcelway.example/redelivery', 'phishing',
  '["Urgency","Suspicious link/domain","Payment request","Unusual sender"]'::jsonb,
  'A text about an unexpected parcel that asks for payment through a link is a common impersonation pattern. Check tracking through the carrier site you enter yourself.', true
),
(
  '20000000-0000-4000-8000-000000000012', 'Parcel out for delivery', 'sms', 'Delivery / Parcel', 'easy',
  'Parcelway Updates', null, null,
  'Your parcel is out for delivery today. You can check the tracking number from the order confirmation or the Parcelway app. No payment is due.',
  null, 'legitimate', '[]'::jsonb,
  'The update does not request credentials or payment and points back to the tracking details from the original order.', true
),
(
  '20000000-0000-4000-8000-000000000013', 'Address correction request', 'email', 'Delivery / Parcel', 'medium',
  'Parcelway Dispatch', 'dispatch@parcelway.example', 'Action needed for delivery',
  'The message says a package cannot be delivered until you sign in and correct your address. It includes a short link and says the parcel will be returned in two hours.',
  'parcelway-address.example/update', 'phishing',
  '["Urgency","Suspicious link/domain","Credential request","Unusual sender"]'::jsonb,
  'The deadline and sign-in request do not prove the message is genuine. Check the order through the merchant or carrier app instead.', true
),
(
  '20000000-0000-4000-8000-000000000014', 'Delivery preference updated', 'email', 'Delivery / Parcel', 'medium',
  'Parcelway Dispatch', 'updates@parcelway.example', 'Delivery preference saved',
  'Your requested delivery preference was saved for the parcel associated with order 48261. If you did not make the change, review the order from the merchant account you normally use.',
  null, 'legitimate', '[]'::jsonb,
  'The message confirms a specific change and does not ask you to sign in through a link or pay a fee.', true
),
(
  '20000000-0000-4000-8000-000000000015', 'Customs notice for an unknown parcel', 'social', 'Delivery / Parcel', 'hard',
  'Parcelway Customs Desk', 'customs@parcelway.example', 'Release notice',
  'A delivery account messages you about an international parcel you do not recognize and asks for a passport number and a customs payment to release it.',
  'release.parcelway.example/customs', 'phishing',
  '["Suspicious link/domain","Credential request","Payment request","Unusual sender"]'::jsonb,
  'Do not send identity documents or payment for a parcel you cannot verify. Check orders and tracking through accounts you already use.', true
),
(
  '20000000-0000-4000-8000-000000000016', 'Remote role with an equipment deposit', 'chat', 'Job & Recruitment', 'easy',
  'Mira, Talent Desk', 'talent@brightpath.example', 'Offer details',
  'You are selected for a remote role without an interview. To reserve the position, send a refundable equipment deposit today; the first-month salary is unusually high.',
  null, 'phishing', '["Unrealistic reward","Urgency","Payment request","Unusual sender"]'::jsonb,
  'A job offer that skips normal screening and requires a deposit is unsafe. Verify openings through the employer site and never pay to receive a job.', true
),
(
  '20000000-0000-4000-8000-000000000017', 'Interview time confirmation', 'email', 'Job & Recruitment', 'easy',
  'Brightpath Recruiting', 'recruiting@brightpath.example', 'Interview scheduled',
  'Your interview for the operations analyst role is scheduled for Thursday at 2 PM. Reply to this message if you need a different time. No documents or payment are requested.',
  null, 'legitimate', '[]'::jsonb,
  'The message describes a normal interview step and does not ask for money, credentials, or sensitive documents.', true
),
(
  '20000000-0000-4000-8000-000000000018', 'Identity file before first interview', 'email', 'Job & Recruitment', 'medium',
  'Brightpath Hiring', 'hiring@brightpath.example', 'Complete your candidate profile',
  'Before speaking with a recruiter, upload a passport scan and tax number to this external form. The email says the application cannot be reviewed without them.',
  'candidate-check.brightpath.example/profile', 'phishing',
  '["Credential request","Suspicious link/domain","Unusual sender"]'::jsonb,
  'A request for sensitive identity documents before a verified hiring process deserves independent confirmation. Contact the employer through its official hiring channel.', true
),
(
  '20000000-0000-4000-8000-000000000019', 'Interview reschedule notice', 'sms', 'Job & Recruitment', 'medium',
  'Brightpath Recruiting', null, null,
  'Your recruiter needs to move tomorrow’s interview to 3:30 PM. Reply if that time does not work. You can also contact the recruiter using the details from your application.',
  null, 'legitimate', '[]'::jsonb,
  'The message only reschedules an existing appointment and gives a safe way to verify using prior application details.', true
),
(
  '20000000-0000-4000-8000-000000000020', 'Background check fee request', 'social', 'Job & Recruitment', 'hard',
  'Brightpath Screening', 'screening@brightpath.example', 'Final step for your offer',
  'A recruiter profile asks for a processing fee by instant transfer before it will release an employment contract. The post promises immediate placement.',
  null, 'phishing', '["Payment request","Unrealistic reward","Impersonation"]'::jsonb,
  'A fee sent to an individual is not a reliable way to verify an offer. Confirm the role through the employer’s known careers page or a verified recruiter.', true
),
(
  '20000000-0000-4000-8000-000000000021', 'Limited-time reward claim', 'social', 'Rewards & Promotions', 'easy',
  'Morrow Rewards', 'rewards@morrow.example', 'Claim your surprise voucher',
  'A post says you have won a high-value voucher, but it will disappear in ten minutes. It asks you to sign in with your email password to claim it.',
  'claim.morrow-rewards.example/redeem', 'phishing',
  '["Urgency","Unrealistic reward","Suspicious link/domain","Credential request"]'::jsonb,
  'The unusually large reward, deadline, and password request are warning signs. Do not sign in from a promotional post.', true
),
(
  '20000000-0000-4000-8000-000000000022', 'Monthly points summary', 'email', 'Rewards & Promotions', 'easy',
  'Morrow Rewards', 'updates@morrow.example', 'Your monthly points summary',
  'You earned 120 points this month. Your points balance is available in the Morrow app whenever you choose to review it. This note has no claim link.',
  null, 'legitimate', '[]'::jsonb,
  'The message is informational and does not require a rushed claim, payment, or password through an email link.', true
),
(
  '20000000-0000-4000-8000-000000000023', 'Prize delivery processing charge', 'sms', 'Rewards & Promotions', 'medium',
  'Morrow Prize Team', null, null,
  'You won a premium tablet in a draw you do not remember entering. Pay a small delivery charge now to release the prize.',
  'morrow-prize.example/delivery', 'phishing',
  '["Unrealistic reward","Payment request","Suspicious link/domain","Unusual sender"]'::jsonb,
  'A prize that requires payment to an unsolicited sender is not verified. Check the promotion rules through the organization’s known app or site.', true
),
(
  '20000000-0000-4000-8000-000000000024', 'Points balance reminder', 'email', 'Rewards & Promotions', 'medium',
  'Morrow Rewards', 'members@morrow.example', 'Points balance update',
  'Your current points balance is 640. It remains available in your account. If you want to redeem it, open the Morrow app directly and review the listed options.',
  null, 'legitimate', '[]'::jsonb,
  'The message provides a balance and asks you to navigate to the app yourself rather than collecting details through a message link.', true
),
(
  '20000000-0000-4000-8000-000000000025', 'Survey reward asks for a sign-in code', 'chat', 'Rewards & Promotions', 'hard',
  'Morrow Member Care', 'care@morrow.example', 'Reward verification',
  'A support account says the reward is ready but needs the one-time code just sent to your phone to confirm the account owner.',
  null, 'phishing', '["Credential request","Impersonation","Unrealistic reward"]'::jsonb,
  'A one-time code should never be shared to claim a reward. Close the chat and check the promotion from the app you normally use.', true
),
(
  '20000000-0000-4000-8000-000000000026', 'Manager requests gift-card codes', 'chat', 'Impersonation', 'easy',
  'Darian, Operations Lead', 'darian@lumenfield.example', 'Quick favor',
  'A message using your manager’s name says they are in a meeting and asks you to buy gift cards now, then send the redemption codes privately.',
  null, 'phishing', '["Impersonation","Urgency","Payment request","Unusual sender"]'::jsonb,
  'A familiar name is not proof of identity. Verify unusual payment requests using a separate, known work channel before doing anything.', true
),
(
  '20000000-0000-4000-8000-000000000027', 'Workplace policy update', 'email', 'Impersonation', 'easy',
  'Lumenfield People Team', 'people@lumenfield.example', 'Updated workplace policy',
  'The People Team has posted a policy update in the staff portal. You can open the portal from your saved work bookmark when convenient.',
  null, 'legitimate', '[]'::jsonb,
  'This routine notice directs employees to a known portal bookmark and does not ask for credentials by email.', true
),
(
  '20000000-0000-4000-8000-000000000028', 'Executive requests payroll change', 'email', 'Impersonation', 'medium',
  'Office of the Director', 'director-office@lumenfield.example', 'Confidential payroll update',
  'The sender asks you to change payroll details before the end of the day and not to contact anyone because the request is confidential.',
  null, 'phishing', '["Impersonation","Urgency","Unusual sender"]'::jsonb,
  'Sensitive payment changes combined with secrecy and urgency require verification through an established internal process.', true
),
(
  '20000000-0000-4000-8000-000000000029', 'Project notes from your lead', 'email', 'Impersonation', 'medium',
  'Lumenfield Project Lead', 'projects@lumenfield.example', 'Notes from today’s review',
  'The project lead shares the meeting notes and lists the next review date. The message asks you to use the team workspace you already access.',
  null, 'legitimate', '[]'::jsonb,
  'The message contains routine project information and refers you to the usual team workspace without an unusual request.', true
),
(
  '20000000-0000-4000-8000-000000000030', 'Vendor asks to redirect an invoice', 'sms', 'Impersonation', 'hard',
  'Lumenfield Accounts Payable', null, null,
  'A text claiming to be from accounts payable says a supplier changed bank details. It asks you to approve a transfer to a new account before close of business.',
  null, 'phishing', '["Impersonation","Urgency","Payment request","Unusual sender"]'::jsonb,
  'A change to payment instructions must be verified through an independently known supplier contact and the organization’s normal approval process.', true
),
(
  '20000000-0000-4000-8000-000000000031', 'Device infection warning', 'social', 'Tech Support', 'easy',
  'Device Care Alert', 'notice@device-care.example', 'Critical device warning',
  'A full-screen warning says your files will be erased unless you call a support number immediately. The notice says not to close the window.',
  'support.device-care.example/alert', 'phishing',
  '["Threatening language","Urgency","Impersonation","Unusual sender"]'::jsonb,
  'Unexpected warnings that threaten data loss and demand an immediate call are a common scare tactic. Close the page and use a trusted support route.', true
),
(
  '20000000-0000-4000-8000-000000000032', 'Planned maintenance notice', 'email', 'Tech Support', 'easy',
  'Lumenfield IT', 'it-notices@lumenfield.example', 'Planned service maintenance',
  'The staff file service will be unavailable from 8 to 8:30 PM for planned maintenance. No action is required. Contact the usual help desk if you have questions.',
  null, 'legitimate', '[]'::jsonb,
  'This is a routine maintenance notice with no request to install software, share credentials, or call an unfamiliar number.', true
),
(
  '20000000-0000-4000-8000-000000000033', 'Remote helper offers a refund', 'chat', 'Tech Support', 'medium',
  'Device Care Support', 'support@device-care.example', 'Refund assistance',
  'The agent says you were billed by mistake and asks you to install a remote-control app so they can return the payment.',
  null, 'phishing', '["Impersonation","Payment request","Unusual sender"]'::jsonb,
  'An unsolicited helper should not be given remote access to your device. Contact the vendor through its known support channel instead.', true
),
(
  '20000000-0000-4000-8000-000000000034', 'Support request update', 'email', 'Tech Support', 'medium',
  'Lumenfield Help Desk', 'helpdesk@lumenfield.example', 'Ticket 7312 updated',
  'Your open support ticket has a new note. Review it in the internal help desk using the bookmark you normally use. No password or code is requested in this email.',
  null, 'legitimate', '[]'::jsonb,
  'The message identifies an existing ticket and tells you to open the known support portal directly.', true
),
(
  '20000000-0000-4000-8000-000000000035', 'Support agent requests a login code', 'sms', 'Tech Support', 'hard',
  'Device Care Technician', null, null,
  'A technician says they can stop a threat on your device but needs the sign-in code that just arrived by text before the protection window closes.',
  null, 'phishing', '["Credential request","Threatening language","Urgency","Impersonation"]'::jsonb,
  'Never share a sign-in code with a support caller or texter. End the conversation and contact support using a number or app you already trust.', true
),
(
  '20000000-0000-4000-8000-000000000036', 'Password expires today', 'email', 'Password / Credential Reset', 'easy',
  'Lumenfield Identity Team', 'identity@lumenfield.example', 'Password expiration notice',
  'The message says your work password expires today and asks you to sign in through the linked page to prevent account suspension.',
  'identity.lumenfield-help.example/reset', 'phishing',
  '["Urgency","Suspicious link/domain","Credential request","Unusual sender"]'::jsonb,
  'A deadline and password request through an email link are warning signs. Use the company identity portal from a saved bookmark.', true
),
(
  '20000000-0000-4000-8000-000000000037', 'Password change confirmation', 'login', 'Password / Credential Reset', 'easy',
  'Lumenfield Identity Team', null, 'Password changed',
  'Your password was changed successfully. If you made this change, no action is needed. If you did not, open the identity portal directly and review account security.',
  null, 'legitimate', '[]'::jsonb,
  'This confirmation does not request the new password or ask you to follow a supplied link. Open the known identity portal if the change is unfamiliar.', true
),
(
  '20000000-0000-4000-8000-000000000038', 'Reset request from an unknown device', 'sms', 'Password / Credential Reset', 'medium',
  'Cloudleaf Password Desk', null, null,
  'A password reset was requested for your account. If you did not request it, reply with your current password so the reset can be canceled.',
  null, 'phishing', '["Credential request","Unusual sender"]'::jsonb,
  'A legitimate service will not need your current password by text to cancel a reset. Use the official account recovery page you open yourself.', true
),
(
  '20000000-0000-4000-8000-000000000039', 'Requested reset link sent', 'email', 'Password / Credential Reset', 'medium',
  'Cloudleaf Security', 'security@cloudleaf.example', 'Password reset requested',
  'A reset link was requested for your account. If you made the request, continue from the Cloudleaf app. If you did not, ignore this message and keep your current password.',
  null, 'legitimate', '[]'::jsonb,
  'The message gives safe next steps and does not ask you to share a password or code with the sender.', true
),
(
  '20000000-0000-4000-8000-000000000040', 'Recovery phrase requested by reset desk', 'social', 'Password / Credential Reset', 'hard',
  'Cloudleaf Reset Desk', 'reset-help@cloudleaf.example', 'Manual reset escalation',
  'A support profile says the reset is blocked and asks you to send the recovery phrase and a one-time code in a private reply.',
  'reset.cloudleaf-help.example/assist', 'phishing',
  '["Credential request","Suspicious link/domain","Impersonation","Unusual sender"]'::jsonb,
  'Recovery phrases and one-time codes must remain private. Close the message and use the account recovery flow from the service directly.', true
)
on conflict (id) do update set
  title = excluded.title,
  channel = excluded.channel,
  category = excluded.category,
  difficulty = excluded.difficulty,
  sender_name = excluded.sender_name,
  sender_address = excluded.sender_address,
  subject = excluded.subject,
  body = excluded.body,
  displayed_url = excluded.displayed_url,
  correct_answer = excluded.correct_answer,
  red_flags = excluded.red_flags,
  explanation = excluded.explanation,
  active = excluded.active;
