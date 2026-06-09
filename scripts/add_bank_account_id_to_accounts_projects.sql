-- Add bank_account_id column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- Add bank_account_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_bank_account_id ON accounts(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_projects_bank_account_id ON projects(bank_account_id);
