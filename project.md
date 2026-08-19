Product Plan — Candidate Online Testing Portal
1. Product Objective

Build a simple hiring assessment portal that allows an administrator to create and manage a question bank, generate randomized candidate tests, issue unique Test IDs, conduct timed assessments, automatically mark MCQs, manually mark descriptive questions, and review complete candidate results.

The product has two users:

Administrator
Candidate

There is only one administrator in the initial version.

2. Core Product Journey

The complete product flow should be:

Admin creates categories/questions
        ↓
Admin creates candidate test
        ↓
System randomly selects questions
        ↓
Unique Test ID generated
        ↓
Candidate receives Test ID
        ↓
Candidate opens portal
        ↓
Candidate enters Test ID
        ↓
Candidate sees instructions
        ↓
Candidate clicks Start Test
        ↓
Timer starts
        ↓
Candidate answers questions
        ↓
Answers continuously saved
        ↓
Candidate submits
        OR
Timer expires
        ↓
Test locked
        ↓
MCQs automatically marked
        ↓
Descriptive questions marked by Admin
        ↓
Final score calculated
        ↓
Admin reviews result
3. Product Modules

The MVP should contain seven main modules:

Admin Login
Categories
Question Bank
Test Creation
Candidate Test Portal
Marking
Results

Everything outside these modules should be treated as a future enhancement unless necessary for the workflow.

4. Admin Login

The administrator needs a simple secure login.

Required
Email/username
Password
Login
Logout

After login, administrator lands on the dashboard.

No roles or permissions management are required for Version 1.

5. Admin Dashboard

The dashboard should give a quick operational overview rather than complicated analytics.

Suggested cards:

Total Questions
Tests Generated
Tests Not Started
Tests In Progress
Tests Submitted
Pending Descriptive Review
Completed Tests

A recent tests table can show:

Candidate	Test ID	Created	Status	Score
Ahmed Ali	A8K2-PQ91	Today	Completed	72/90
Sara Khan	T7MM-128P	Today	Pending Review	—

The dashboard is primarily for navigation and visibility.

6. Category Management

The system initially contains:

IQ
Accounting
Tax

But categories must be manageable because more will be added later.

Category screen

Administrator can:

Add category
Rename category
Activate/deactivate category

Example:

Category	Status
IQ	Active
Accounting	Active
Tax	Active
Audit	Active
Corporate Law	Inactive
Product rule

A category already used in historical tests should not be permanently deleted.

It can instead be marked inactive.

7. Question Bank

The Question Bank is one of the most important parts of the application.

Each question belongs to one category.

Two question types exist:

MCQ
Descriptive
8. Add MCQ

Administrator chooses:

Question Type: MCQ
Category: Accounting

Then enters:

Question text
Optional image/screenshot
Marks
Option A
Option B
Option C
Option D
Correct option

Each option can contain text.

If needed, answer options can also support images.

Example:

Question:
Which of the following is a current asset?


A. Share Capital
B. Inventory
C. Long-term Loan
D. Retained Earnings


Correct Answer:
B


Marks:
2
MCQ rules

Every MCQ must have:

Exactly 4 options
Exactly one correct option
Marks greater than zero
Category
Question content

No negative marking.

9. Add Descriptive Question

Administrator chooses:

Question Type: Descriptive

Then enters:

Category
Question text
Optional image
Maximum marks

Example:

Explain the difference between capital expenditure
and revenue expenditure.


Maximum Marks: 5

No predefined answer options are required.

10. Question Images

Questions may contain screenshots.

Administrator should be able to:

Upload image
Preview image
Replace image
Remove image

Typical use cases:

Accounting workings
Financial statements
Tax extracts
Charts
IQ diagrams
Screenshots

The candidate should see the image clearly within the question.

Click-to-enlarge is a useful MVP feature if screenshots may contain small text.

11. Question Bank Listing

The administrator needs an efficient list screen.

Suggested columns:

Category	Type	Question	Marks	Status	Action
IQ	MCQ	Number series...	1	Active	Edit
Tax	MCQ	Calculate tax...	3	Active	Edit
Accounting	Descriptive	Explain impairment...	5	Active	Edit
Filters
Category
Question type
Active/inactive
Keyword search
Actions
View
Edit
Activate/deactivate

Permanent deletion should only be allowed for unused questions, if you want deletion at all.

12. Candidate Test Creation

This should be a single simple screen.

Administrator enters:

Candidate Information
Candidate Name
CNIC
Test Configuration

For each selected category:

Category
Number of questions

Then:

Test duration

Example:

Candidate Name:
Ahmed Ali


CNIC:
35202-1234567-1


IQ
20 Questions


Accounting
15 Questions


Tax
10 Questions


Duration
60 Minutes

Admin clicks:

Generate Test

13. Test Generation Rules

When Generate Test is clicked, the system must:

Validate candidate details.
Validate selected categories.
Validate question counts.
Confirm enough active questions exist.
Randomly select questions.
Keep questions grouped by category.
Save the selected questions permanently against that test.
Calculate total possible marks.
Generate a unique Test ID.
Set the Test ID's start-access expiry to one hour after creation.
14. Insufficient Question Handling

The administrator should never discover the shortage after generating the test.

Example:

Admin requests:

Tax Questions: 20

Available active Tax questions:

14

Show:

20 Tax questions requested, but only 14 active questions are available.

The test should not be generated until corrected.

15. Randomization Rules

Final agreed rules:

Randomize
Questions selected for each candidate
Question order inside each category
Do not randomize
Category order
Answer option order

Example:

IQ
Q1
Q2
Q3
...


Accounting
Q11
Q12
Q13
...


Tax
Q26
Q27
...

Different candidates may receive the same questions.

A question must not appear twice within the same test.

16. Test ID

After successful generation, display something prominent such as:

Candidate:
Ahmed Ali


Test ID:
A8KM-P2Q7


Valid Until:
7:15 PM


[Copy Test ID]

The administrator manually shares this Test ID with the candidate.

No email/SMS sending is required.

17. One-Hour Test ID Validity

The Test ID must be started within one hour of generation.

Example:

Generated: 3:00 PM
Start before: 4:00 PM

If no test has started before 4:00 PM:

Test ID expired.

If the candidate starts at 3:55 PM:

Test Duration: 60 minutes
Candidate may continue until 4:55 PM

The one-hour limit applies only to starting the assessment.

18. Test Statuses

The product should clearly distinguish operational states.

Recommended statuses:

Ready

Test generated but not started.

Expired

Candidate did not start within the one-hour window.

In Progress

Candidate started the test and timer is active.

Submitted

Candidate manually submitted.

Auto Submitted

Timer expired.

Pending Review

Test contains descriptive answers requiring admin marking.

Completed

Final marks are available.

The UI can simplify these names if necessary, but the underlying states should remain clear.

19. Candidate Entry Screen

Candidate opens the test website and sees only:

Candidate Assessment


Enter Test ID


[____________]


[Continue]

No account creation.

No password.

No CNIC entry.

20. Test ID Validation

After entry, system checks:

ID exists
ID has not expired before starting
Test has not already been completed
Test is valid

Possible responses:

Valid new test

Continue to instructions.

Invalid

Invalid Test ID.

Expired

This Test ID has expired. Please contact the administrator.

Already completed

This test has already been submitted.

Existing in-progress test

Resume the test with original remaining time.

21. Instructions Screen

Before the timer starts, display:

Candidate:
Ahmed Ali


Total Questions:
45


Total Marks:
72


Test Duration:
60 Minutes

Categories:

IQ — 20 Questions
Accounting — 15 Questions
Tax — 10 Questions

Instructions:

Use a laptop or desktop computer.
Timer begins when Start Test is clicked.
Test must be completed before the timer expires.
Answers are saved during the test.
You may move between questions.
You may change answers before submission.
The test will automatically submit when time expires.
Refreshing or reopening the browser does not reset the timer.
Final submission cannot be reversed.

Then:

Start Test

22. Start Test

Nothing starts before the candidate clicks Start Test.

Once clicked:

Test becomes In Progress.
Start time is recorded.
End time is calculated.
Timer begins.
First question opens.

The candidate cannot return to the instructions and restart the timer.

23. Candidate Test Layout

Desktop-oriented layout.

Suggested:

Candidate: Ahmed Ali
Remaining Time: 46:18


--------------------------------------


SECTION: IQ


Question 7 of 45


[Question text]


[Image if applicable]


○ A. Option
○ B. Option
○ C. Option
○ D. Option


--------------------------------------


[Previous]        [Save & Next]


Questions:


1 ✓  2 ✓  3 ○  4 ✓  5 ○
6 ✓  7 ●  8 ○  9 ○  10 ○
24. Descriptive Answer Interface

For descriptive questions:

Question:


Explain the treatment of deferred tax.


[Large text box]




Character Count: 284


[Previous]       [Save & Next]

There is no requirement for rich-text editing.

A plain multiline text field is sufficient.

25. Answer Status

Questions should visually indicate:

Answered
Unanswered
Current

Optionally:

Descriptive answer saved

Simple example:

✓ Answered
○ Unanswered
● Current

This helps candidates identify unanswered questions before submission.

26. Saving Behaviour

Saving should be automatic.

MCQ

When candidate clicks an answer:

Option B selected
      ↓
Saved automatically
Descriptive

Autosave:

Shortly after typing stops
When candidate changes question
When Save & Next is clicked

The interface should show:

Saving...

then:

Saved
27. Answer Editing

Until final submission or timer expiry, candidate can:

Go backward
Go forward
Change MCQ selection
Edit descriptive text
Jump directly to another question

The latest saved answer is considered the candidate's final answer.

28. Browser Refresh / Reopening

The product must handle accidental refreshes safely.

If the candidate:

Refreshes
Closes browser
Reopens browser

they should be able to re-enter the same Test ID and continue.

The system restores:

Same test
Same questions
Saved answers
Remaining time

Example:

Started: 2:00 PM
Ends: 3:00 PM


Browser reopened: 2:42 PM


Remaining:
18 minutes
29. Test Completion Review

When candidate clicks Submit Test, show a review summary:

Test Summary


Total Questions: 45


Answered: 42
Unanswered: 3


You will not be able to change your answers after submission.

Buttons:

[Return to Test]


[Submit Test]

The candidate should be allowed to submit even with unanswered questions.

30. Manual Submission

When candidate confirms submission:

Test immediately locks.
All saved answers become final.
No further editing is permitted.
MCQ marking begins.
Descriptive questions become pending review.
Candidate sees success page.
31. Timer Expiry

At zero:

00:00

the test automatically submits.

No confirmation required.

Candidate sees:

Time has expired. Your test has been submitted successfully.

Any previously saved responses count.

Unsaved text should be minimized through frequent autosaving.

32. Candidate Completion Screen

Candidate should only see:

Test Submitted Successfully


Thank you for completing the assessment.

Do not show:

Marks
Percentage
Correct answers
Incorrect answers
Pass/fail
Category performance
33. Automatic MCQ Marking

Each MCQ result is:

Correct
or
Incorrect
or
Unanswered

Marks:

Correct → Full question marks
Incorrect → 0
Unanswered → 0

No partial marks.

No negative marks.

Example:

Question worth 4 marks.


Correct → 4
Incorrect → 0
34. Descriptive Marking

Tests containing descriptive questions enter:

Pending Review

Admin opens the candidate's test.

For each descriptive question:

Question
Maximum Marks
Candidate Answer


Marks Awarded
[     ]

Admin can assign:

0 → Maximum Marks

Decimal values should be allowed.

Example:

Maximum: 5
Awarded: 3.5
35. Marking Workflow

For mixed tests:

Candidate submits
      ↓
MCQ marks calculated immediately
      ↓
Descriptive questions require Admin review
      ↓
Admin assigns descriptive marks
      ↓
Final score calculated
      ↓
Status becomes Completed

Admin should be able to save partial marking and return later.

36. Results Dashboard

The Results screen should prioritize quick review.

Suggested columns:

Candidate	CNIC	Test ID	Submitted	Score	Status
Ahmed Ali	35202-...	A8KM-P2Q7	Today	67/80	Completed
Sara Khan	61101-...	Q77P-K19X	Today	—	Pending Review
Search
Name
CNIC
Test ID
Filters
Date
Status
37. Test Management Screen

It is useful to distinguish Tests from Results.

The Tests page can show everything generated:

Candidate	Test ID	Generated	Valid Until	Status
Ahmed	A8KM-P2Q7	6:00 PM	7:00 PM	Ready
Sara	PP21-XZ90	4:30 PM	5:30 PM	Expired
Ali	AM91-LL22	3:00 PM	—	In Progress

This is particularly useful if candidates call HR because their ID does not work.

38. Result Detail

The administrator should be able to inspect the complete assessment.

Candidate Information
Name
CNIC
Test ID
Generated At
Started At
Submitted At
Duration
Submission Method
Overall Result
Total Marks
Obtained Marks
Percentage

No pass/fail required.

39. MCQ Result Review

Example:

Question 12


What is the balance of the account?


Candidate Answer:
B. Rs. 150,000


Correct Answer:
C. Rs. 175,000


Result:
Incorrect


Marks:
0 / 2
40. Descriptive Result Review

Example:

Question 18


Explain deferred taxation.


Candidate Answer:


Deferred tax arises when...


Maximum Marks:
5


Marks Awarded:
3.5

Admin should be able to update the descriptive mark until the result is finalized.

41. Same Candidate, Multiple Tests

CNIC should not be unique.

Example:

Ahmed Ali
35202-1234567-1

can appear in:

Test 1 — January
Test 2 — March
Test 3 — August

Each remains separate.

When searching by CNIC, all historical assessments should be visible.

42. Product Rules for Historical Tests

Once a test is generated:

Its selected questions must never change.
Its marks must never change because the Question Bank was later edited.
Its answer options must remain as originally issued.
Historical result must show exactly what the candidate saw.

This should be treated as a core product rule, not merely a technical implementation detail.

43. Dashboard Priorities

Avoid overbuilding analytics for Version 1.

Useful operational information:

Question Bank:
423 Active Questions


Tests:
12 Ready
2 In Progress
8 Completed


Marking:
3 Pending Review

That is sufficient.

Charts are unnecessary initially.

44. Error and Edge Cases

The product should handle these gracefully.

Candidate loses connection

Their last successfully saved answers remain.

When connection returns:

Continue saving.
Timer continues normally.
Candidate double-clicks Start

Test should start only once.

Candidate opens same Test ID in two tabs

Both may display the same session, but server state remains authoritative.

If one submits, the other must immediately become read-only when it next communicates with the server.

Candidate submits at the same moment timer expires

Only one final submission state should be accepted.

Admin edits question during an active test

Active candidate's question remains unchanged.

Candidate enters expired ID

Cannot start.

Candidate enters completed ID

Cannot reopen test.

45. Desktop Restriction

If screen size indicates a phone/mobile device, display:

This assessment must be completed using a laptop or desktop computer.

It does not have to be impossible to bypass.

This is a user-experience restriction rather than an anti-cheating mechanism.

Tablet support can also be considered unsupported in Version 1.

46. MVP Scope

The MVP is complete when the administrator can:

Log in
Manage categories
Add MCQs
Add descriptive questions
Add screenshots
Set marks
Search/filter questions
Create a candidate test
Choose categories and question counts
Set test duration
Generate a random test
Receive a unique Test ID
See test status
Review submitted assessments
Mark descriptive answers
View final overall marks
Inspect all questions and answers

And the candidate can:

Enter Test ID
Read instructions
Start assessment
See countdown timer
Answer MCQs
Write descriptive answers
Move backward/forward
Change answers
See answered/unanswered questions
Refresh/reopen and continue
Submit manually
Be automatically submitted on timeout
47. MVP Development Milestones
Milestone 1 — Question Bank

Deliver:

Admin login
Categories
MCQ management
Descriptive questions
Images
Marks
Question listing/search

Product outcome: the complete assessment content can be maintained.

Milestone 2 — Test Generator

Deliver:

Candidate entry
Category selection
Question counts
Duration
Random generation
Test ID
One-hour validity
Test listing/status

Product outcome: administrator can prepare an assessment and hand a candidate a usable ID.

Milestone 3 — Candidate Assessment

Deliver:

Test ID validation
Instructions
Start Test
Timer
Category grouping
MCQ answers
Descriptive answers
Navigation
Autosave
Refresh/resume

Product outcome: candidate can complete a full assessment.

Milestone 4 — Submission & Marking

Deliver:

Manual submission
Auto submission
MCQ auto-marking
Descriptive review
Overall marks

Product outcome: every submitted test can produce a final score.

Milestone 5 — Results & Final QA

Deliver:

Results list
Search/filter
Detailed review
Historical candidate tests
Expired tests
Edge-case handling
Production QA

Product outcome: the system is ready for actual recruitment testing.

48. Not in MVP

Explicitly leave these out:

Multiple admin roles
Candidate accounts
Email invitations
SMS
Candidate score display
Reports/export
Charts/analytics
Pass/fail rules
Category-specific passing criteria
Separate category timers
Negative marking
Random answer ordering
Mobile testing
Anti-cheating functionality
Webcam
Tab tracking
Copy/paste blocking
AI descriptive marking
HR system integrations
Scheduled tests
Candidate self-registration
Bulk candidate import

Keeping these outside the MVP will prevent scope creep.

49. Product Backlog After MVP

Potential later enhancements can be kept as a separate backlog:

Priority A
Duplicate an existing test configuration
Reset/reissue expired Test ID
Export results to Excel
PDF candidate result
Add admin comments/notes
Category-wise scores
Priority B
Multiple administrators
Admin roles
Bulk question import
Bulk candidates
Email Test IDs
Scheduled availability window
Candidate photo
Priority C
Anti-cheating
Tab-switch detection
Question pools/difficulty levels
AI-assisted descriptive marking
Analytics/dashboard charts
Candidate comparison/ranking

None of these should block Version 1.

50. Final Product Definition

The first release should be viewed as a controlled assessment workflow, not a general examination platform.

Its job is simply to make this hiring process reliable:

Prepare Questions → Generate Candidate Test → Candidate Completes Timed Assessment → Mark Answers → Review Result.

If those five activities are extremely clear and dependable, Version 1 is successful.

For product execution, I would freeze the MVP around these five priorities:

Question Bank, Test Generation, Timed Candidate Experience, Reliable Saving/Submission, and Result Review.

Everything else is secondary.