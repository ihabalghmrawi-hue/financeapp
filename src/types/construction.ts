export interface ConstructionProject {
  id: string
  company_id: string
  name: string
  description: string | null
  client_name: string | null
  client_phone: string | null
  location: string | null
  type: string
  status: string
  priority: string
  stage: string | null
  engineer_name: string | null
  start_date: string | null
  end_date: string | null
  budget: number
  expected_cost: number
  actual_cost: number
  contract_value: number
  total_expenses: number
  total_payments: number
  refunded_amount: number
  progress_pct: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ConstructionWorker {
  id: string
  company_id: string
  name: string
  phone: string | null
  job_type: string
  daily_rate: number
  status: string
  rating: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConstructionTask {
  id: string
  company_id: string
  project_id: string | null
  worker_id: string | null
  title: string
  description: string | null
  status: string
  priority: string
  progress: number
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  con_projects?: { name: string } | null
  con_workers?: { name: string; job_type?: string } | null
}

export interface ConstructionExpense {
  id: string
  company_id: string
  project_id: string | null
  category: string
  description: string
  amount: number
  supplier: string | null
  payment_method: string
  expense_date: string
  notes: string | null
  receipt_url: string | null
  created_by: string | null
  created_at: string
  con_projects?: { name: string } | null
}

export interface ConstructionMaterial {
  id: string
  company_id: string
  project_id: string | null
  name: string
  supplier: string | null
  unit: string
  quantity: number
  unit_price: number
  total_cost: number
  purchase_date: string
  notes: string | null
  created_at: string
  con_projects?: { name: string } | null
}

export interface ConstructionPayment {
  id: string
  company_id: string
  project_id: string | null
  type: string
  amount: number
  description: string | null
  payment_method: string
  payment_date: string
  reference: string | null
  notes: string | null
  created_at: string
  con_projects?: { name: string } | null
}

export interface ConstructionFile {
  id: string
  company_id: string
  project_id: string | null
  name: string
  url: string
  type: string
  size: number | null
  notes: string | null
  uploaded_by: string | null
  created_at: string
  con_projects?: { name: string } | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
