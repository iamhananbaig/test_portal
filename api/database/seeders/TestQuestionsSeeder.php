<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Database\Seeder;

class TestQuestionsSeeder extends Seeder
{
    public function run(): void
    {
        Category::where('id', 4)->delete();

        Question::whereIn('id', [1, 2])->delete();

        $iq = Category::where('name', 'IQ MCQs')->first();
        $accounting = Category::where('name', 'Accounting MCQs')->first();
        $tax = Category::where('name', 'Tax MCQs')->first();

        $this->seedIqQuestions($iq);
        $this->seedAccountingQuestions($accounting);
        $this->seedTaxQuestions($tax);
    }

    private function seedIqQuestions(Category $category): void
    {
        $questions = [
            [
                'text' => 'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
                'options' => [
                    ['label' => 'A', 'text' => '36', 'is_correct' => false],
                    ['label' => 'B', 'text' => '40', 'is_correct' => false],
                    ['label' => 'C', 'text' => '42', 'is_correct' => true],
                    ['label' => 'D', 'text' => '44', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'If APPLE = 50, then BANANA = ?',
                'options' => [
                    ['label' => 'A', 'text' => '54', 'is_correct' => false],
                    ['label' => 'B', 'text' => '57', 'is_correct' => true],
                    ['label' => 'C', 'text' => '60', 'is_correct' => false],
                    ['label' => 'D', 'text' => '63', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'A clock shows 3:15. What is the angle between the hour and minute hands?',
                'options' => [
                    ['label' => 'A', 'text' => '0 degrees', 'is_correct' => true],
                    ['label' => 'B', 'text' => '7.5 degrees', 'is_correct' => false],
                    ['label' => 'C', 'text' => '15 degrees', 'is_correct' => false],
                    ['label' => 'D', 'text' => '22.5 degrees', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which word is the odd one out?',
                'options' => [
                    ['label' => 'A', 'text' => 'Flour', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Table', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Chair', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Desk', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'If you rearrange the letters "CIFAIPC" you get the name of a:',
                'options' => [
                    ['label' => 'A', 'text' => 'City', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Animal', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Ocean', 'is_correct' => true],
                    ['label' => 'D', 'text' => 'River', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Complete the analogy: Book is to Reading as Fork is to ?',
                'options' => [
                    ['label' => 'A', 'text' => 'Drawing', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Writing', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Eating', 'is_correct' => true],
                    ['label' => 'D', 'text' => 'Spooning', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'A farmer has 17 sheep. All but 9 die. How many sheep are left?',
                'options' => [
                    ['label' => 'A', 'text' => '8', 'is_correct' => false],
                    ['label' => 'B', 'text' => '9', 'is_correct' => true],
                    ['label' => 'C', 'text' => '17', 'is_correct' => false],
                    ['label' => 'D', 'text' => '0', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which number replaces the question mark: 3, 9, 27, 81, ?',
                'options' => [
                    ['label' => 'A', 'text' => '162', 'is_correct' => false],
                    ['label' => 'B', 'text' => '243', 'is_correct' => true],
                    ['label' => 'C', 'text' => '216', 'is_correct' => false],
                    ['label' => 'D', 'text' => '324', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?',
                'options' => [
                    ['label' => 'A', 'text' => '100 minutes', 'is_correct' => false],
                    ['label' => 'B', 'text' => '5 minutes', 'is_correct' => true],
                    ['label' => 'C', 'text' => '10 minutes', 'is_correct' => false],
                    ['label' => 'D', 'text' => '1 minute', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which figure completes the pattern: Square, Triangle, Circle, Square, Triangle, ?',
                'options' => [
                    ['label' => 'A', 'text' => 'Square', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Triangle', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Circle', 'is_correct' => true],
                    ['label' => 'D', 'text' => 'Pentagon', 'is_correct' => false],
                ],
            ],
        ];

        foreach ($questions as $q) {
            $question = Question::create([
                'category_id' => $category->id,
                'text' => $q['text'],
                'type' => 'mcq',
                'marks' => 1,
                'is_active' => true,
            ]);

            foreach ($q['options'] as $opt) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'label' => $opt['label'],
                    'text' => $opt['text'],
                    'is_correct' => $opt['is_correct'],
                ]);
            }
        }
    }

    private function seedAccountingQuestions(Category $category): void
    {
        $questions = [
            [
                'text' => 'What is the fundamental accounting equation?',
                'options' => [
                    ['label' => 'A', 'text' => 'Assets = Liabilities + Equity', 'is_correct' => true],
                    ['label' => 'B', 'text' => 'Assets = Liabilities - Equity', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Assets + Equity = Liabilities', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Assets + Liabilities = Equity', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which of the following is a contra asset account?',
                'options' => [
                    ['label' => 'A', 'text' => 'Accounts Receivable', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Accumulated Depreciation', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Prepaid Insurance', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Inventory', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Under the accrual basis of accounting, revenue is recognized when:',
                'options' => [
                    ['label' => 'A', 'text' => 'Cash is received', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'The service is performed or goods delivered', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'The invoice is sent', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'The contract is signed', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'What does the current ratio measure?',
                'options' => [
                    ['label' => 'A', 'text' => 'Long-term solvency', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Short-term liquidity', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Profitability', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Market value', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Depreciation is the process of:',
                'options' => [
                    ['label' => 'A', 'text' => 'Increasing asset value', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Allocating the cost of an asset over its useful life', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Selling an asset at a loss', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Writing off an asset completely', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which financial statement shows revenues and expenses over a period?',
                'options' => [
                    ['label' => 'A', 'text' => 'Balance Sheet', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Income Statement', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Cash Flow Statement', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Statement of Equity', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'What is the purpose of a trial balance?',
                'options' => [
                    ['label' => 'A', 'text' => 'To prepare financial statements', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'To verify that total debits equal total credits', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'To calculate net income', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'To record daily transactions', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which of the following is an example of a fixed cost?',
                'options' => [
                    ['label' => 'A', 'text' => 'Raw materials', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Direct labor', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Rent', 'is_correct' => true],
                    ['label' => 'D', 'text' => 'Sales commissions', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'What does the gross profit margin indicate?',
                'options' => [
                    ['label' => 'A', 'text' => 'Overall profitability after all expenses', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Efficiency of production relative to revenue', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Ability to pay short-term debts', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Return on shareholder investment', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'The double-entry bookkeeping system requires that:',
                'options' => [
                    ['label' => 'A', 'text' => 'Every transaction affects only one account', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Every debit must have a corresponding credit', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Only assets and liabilities are recorded', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Transactions are recorded only when cash changes hands', 'is_correct' => false],
                ],
            ],
        ];

        foreach ($questions as $q) {
            $question = Question::create([
                'category_id' => $category->id,
                'text' => $q['text'],
                'type' => 'mcq',
                'marks' => 1,
                'is_active' => true,
            ]);

            foreach ($q['options'] as $opt) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'label' => $opt['label'],
                    'text' => $opt['text'],
                    'is_correct' => $opt['is_correct'],
                ]);
            }
        }
    }

    private function seedTaxQuestions(Category $category): void
    {
        $questions = [
            [
                'text' => 'What is the standard income tax year in Pakistan?',
                'options' => [
                    ['label' => 'A', 'text' => 'January to December', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'April to March', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'July to June', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'October to September', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which of the following is subject to sales tax in Pakistan?',
                'options' => [
                    ['label' => 'A', 'text' => 'Basic food items (flour, rice)', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Goods imported into Pakistan', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Educational services', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Healthcare services', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'What is the withholding tax rate on bank withdrawals above the threshold in Pakistan?',
                'options' => [
                    ['label' => 'A', 'text' => '0.1%', 'is_correct' => false],
                    ['label' => 'B', 'text' => '0.3%', 'is_correct' => false],
                    ['label' => 'C', 'text' => '0.6%', 'is_correct' => true],
                    ['label' => 'D', 'text' => '1.0%', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'FBR stands for:',
                'options' => [
                    ['label' => 'A', 'text' => 'Federal Board of Revenue', 'is_correct' => true],
                    ['label' => 'B', 'text' => 'Federal Bureau of Reports', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Federal Banking Regulation', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Federal Budget Review', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'What is the minimum income threshold for salaried individuals to file a tax return in Pakistan?',
                'options' => [
                    ['label' => 'A', 'text' => 'PKR 500,000', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'PKR 600,000', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'PKR 1,000,000', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'PKR 1,200,000', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Capital gains tax is levied on:',
                'options' => [
                    ['label' => 'A', 'text' => 'Salary income', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Profit from sale of assets', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Interest earned on savings', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Rental income', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'What is the role of a tax consultant?',
                'options' => [
                    ['label' => 'A', 'text' => 'Collect taxes on behalf of government', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Advise clients on tax planning and compliance', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Audit government accounts', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Print tax forms', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Which tax is imposed on the value added at each stage of production?',
                'options' => [
                    ['label' => 'A', 'text' => 'Income Tax', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Sales Tax (VAT/GST)', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Property Tax', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Excise Duty', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'What is a tax return?',
                'options' => [
                    ['label' => 'A', 'text' => 'A refund of overpaid taxes', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'A declaration of income and taxes payable filed with the tax authority', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'A receipt for tax payment', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'A notice from the tax authority', 'is_correct' => false],
                ],
            ],
            [
                'text' => 'Excise duty is typically levied on:',
                'options' => [
                    ['label' => 'A', 'text' => 'All consumer goods', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Specific goods like tobacco, fuel, and beverages', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Professional services', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Import of raw materials only', 'is_correct' => false],
                ],
            ],
        ];

        foreach ($questions as $q) {
            $question = Question::create([
                'category_id' => $category->id,
                'text' => $q['text'],
                'type' => 'mcq',
                'marks' => 1,
                'is_active' => true,
            ]);

            foreach ($q['options'] as $opt) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'label' => $opt['label'],
                    'text' => $opt['text'],
                    'is_correct' => $opt['is_correct'],
                ]);
            }
        }
    }
}
